import os
import json
import re
import joblib
import torch
import torch.nn as nn
import numpy as np
from tqdm import tqdm

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from src.predict import segment_text, hybrid_crf_model


# =========================================================
# CONFIG
# =========================================================

TEST_JUDGEMENT_DIR = "IN-Abs/test-data/judgement"
TEST_SUMMARY_DIR   = "IN-Abs/test-data/summary"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RHET_MODEL_DIR = os.path.join(BASE_DIR, "models", "hierarchical_bilstm_crf")

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

COMPRESSION_RATIO = 0.217
MMR_LAMBDA = 0.7
MIN_SENTENCES = 5


# ---------------------------------------------------------
# ROLE WEIGHTS
# ---------------------------------------------------------

ROLE_WEIGHTS = {
    "Decision": 1.0,
    "Conclusion": 0.95,
    "Reasoning": 0.9,
    "Issue": 0.8,
    "Facts": 0.7,
    "Arguments": 0.6,
    "Other": 0.5
}


# =========================================================
# LOAD CRF LIB
# =========================================================

try:
    from torchcrf import CRF
except ImportError:
    from TorchCRF import CRF


# =========================================================
# RHETORICAL MODEL
# =========================================================

class HierarchicalBiLSTMCRF(nn.Module):

    def __init__(self, vocab_size, num_labels,
                 emb_dim=128, word_hidden=128, sent_hidden=128):

        super().__init__()

        self.embedding = nn.Embedding(vocab_size, emb_dim, padding_idx=0)

        self.word_lstm = nn.LSTM(
            emb_dim,
            word_hidden,
            bidirectional=True,
            batch_first=True
        )

        self.sent_lstm = nn.LSTM(
            word_hidden * 2,
            sent_hidden,
            bidirectional=True,
            batch_first=True
        )

        self.hidden2tag = nn.Linear(sent_hidden * 2, num_labels)

        self.crf = CRF(num_labels, batch_first=True)

    def decode(self, X, mask):

        B, S, T = X.shape
        X = X.view(B * S, T)

        emb = self.embedding(X)

        word_out, _ = self.word_lstm(emb)

        sent_vec, _ = torch.max(word_out, dim=1)

        sent_vec = sent_vec.view(B, S, -1)

        doc_out, _ = self.sent_lstm(sent_vec)

        emissions = self.hidden2tag(doc_out)

        return self.crf.decode(emissions, mask=mask)


# =========================================================
# LOAD RHET MODEL
# =========================================================

def load_rhetorical_model():

    vocab = joblib.load(os.path.join(RHET_MODEL_DIR, "vocab.joblib"))

    label_encoder = joblib.load(
        os.path.join(RHET_MODEL_DIR, "label_encoder.joblib")
    )

    model = HierarchicalBiLSTMCRF(
        vocab_size=len(vocab),
        num_labels=len(label_encoder.classes_)
    ).to(DEVICE)

    model.load_state_dict(
        torch.load(
            os.path.join(RHET_MODEL_DIR, "best_model.pt"),
            map_location=DEVICE
        )
    )

    model.eval()

    return model, vocab, label_encoder


# =========================================================
# SENTENCE SEGMENTATION
# =========================================================

def split_sentences(judgement):

    lines = judgement.split("\n")

    sentences = []

    for line in lines:

        if not line.strip():
            continue

        seg = segment_text(
            line,
            hybrid_crf_model,
            use_hybrid_features=True
        )

        sentences.extend(seg)

    cleaned = []

    for s in sentences:

        s = re.sub(r"\s+", " ", s).strip()

        if len(s) > 5:
            cleaned.append(s)

    return cleaned


# =========================================================
# ROLE PREDICTION
# =========================================================

def encode_sentences(sentences, vocab, max_tokens=60):

    def encode(sentence):

        tokens = re.findall(r"\w+|[^\w\s]", sentence.lower())

        ids = [vocab.get(t, vocab.get("<UNK>", 1)) for t in tokens]

        ids = ids[:max_tokens]

        return ids + [0] * (max_tokens - len(ids))

    X = torch.tensor([[encode(s) for s in sentences]], device=DEVICE)

    mask = torch.ones(
        (1, len(sentences)),
        dtype=torch.bool,
        device=DEVICE
    )

    return X, mask


def predict_roles(sentences, model, vocab, label_encoder):

    X, mask = encode_sentences(sentences, vocab)

    with torch.no_grad():
        preds = model.decode(X, mask)[0]

    roles = [label_encoder.classes_[p] for p in preds]

    return roles


# =========================================================
# MMR
# =========================================================

def mmr(sent_emb, doc_emb, lambda_param, top_k):

    selected = []

    candidates = list(range(len(sent_emb)))

    sim_to_doc = cosine_similarity(sent_emb, doc_emb)

    while len(selected) < top_k and candidates:

        best_score = -1e9
        best_idx = None

        for idx in candidates:

            relevance = sim_to_doc[idx][0]

            redundancy = 0

            if selected:

                redundancy = max(
                    cosine_similarity(
                        sent_emb[idx].reshape(1, -1),
                        sent_emb[selected]
                    )[0]
                )

            score = lambda_param * relevance - (1 - lambda_param) * redundancy

            if score > best_score:
                best_score = score
                best_idx = idx

        selected.append(best_idx)

        candidates.remove(best_idx)

    return selected


# =========================================================
# ROLE-AWARE TFIDF + MMR SUMMARIZER
# =========================================================

def summarize(
    sentences,
    rhet_model,
    vocab,
    label_encoder,
    compression=COMPRESSION_RATIO,
    top_k=None,
    preserve_order=True
):

    if len(sentences) == 0:
        return [], np.array([]), {}

    # --------------------------------
    # Predict rhetorical roles
    # --------------------------------
    roles = predict_roles(sentences, rhet_model, vocab, label_encoder)

    # --------------------------------
    # TF-IDF
    # --------------------------------
    vectorizer = TfidfVectorizer(stop_words="english")

    tfidf_matrix = vectorizer.fit_transform(sentences).toarray()

    doc_embedding = tfidf_matrix.mean(axis=0).reshape(1, -1)

    tfidf_scores = cosine_similarity(tfidf_matrix, doc_embedding).flatten()

    if tfidf_scores.sum() > 0:
        tfidf_scores = tfidf_scores / tfidf_scores.sum()
    else:
        tfidf_scores = np.ones(len(sentences)) / len(sentences)

    # --------------------------------
    # Role scores
    # --------------------------------
    role_scores = np.array([
        ROLE_WEIGHTS.get(r, 0.5) for r in roles
    ])

    role_scores = role_scores / role_scores.sum()

    # --------------------------------
    # Combined weights
    # --------------------------------
    weights = 0.7 * tfidf_scores + 0.3 * role_scores

    if weights.sum() > 0:
        weights = weights / weights.sum()
    else:
        weights = np.ones(len(sentences)) / len(sentences)

    # --------------------------------
    # Determine number of sentences
    # --------------------------------
    if top_k is not None:
        n_select = min(top_k, len(sentences))
    else:
        n_select = max(MIN_SENTENCES, int(len(sentences) * compression))

    # --------------------------------
    # Run MMR
    # --------------------------------
    selected_indices = mmr(
        tfidf_matrix,
        doc_embedding,
        MMR_LAMBDA,
        n_select
    )

    if preserve_order:
        selected_indices = sorted(selected_indices)

    selected_sentences = [sentences[i] for i in selected_indices]

    component_scores = {
        "tfidf": tfidf_scores,
        "role": role_scores
    }

    return selected_sentences, weights, component_scores


# =========================================================
# MAIN
# =========================================================

def main():

    dataset = load_inabs_dataset(
        TEST_JUDGEMENT_DIR,
        TEST_SUMMARY_DIR
    )

    rhet_model, vocab, label_encoder = load_rhetorical_model()

    stored_outputs = []

    for doc in tqdm(dataset):

        sentences, weights, component_scores = summarize(
            split_sentences(doc["judgement"]),
            rhet_model,
            vocab,
            label_encoder
        )

        summary = " ".join(sentences)

        stored_outputs.append({
            "doc_id": doc["doc_id"],
            "judgement": doc["judgement"],
            "generated_summary": summary,
            "reference_summary": doc["summary"],
            "weights": weights.tolist(),
            "component_scores": {
                k: v.tolist() for k, v in component_scores.items()
            }
        })

    os.makedirs("stored_summaries", exist_ok=True)

    with open(
        "stored_summaries/role_aware_tfidf_mmr.json",
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(stored_outputs, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()