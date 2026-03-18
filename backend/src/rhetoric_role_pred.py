import os
import json
import re
import torch
import torch.nn as nn
import joblib
from torchcrf import CRF

print("Loaded CRF from torchcrf")

# --------------------------------------------------
# PATH CONFIG
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RHET_DIR = os.path.join(BASE_DIR, "models", "hierarchical_bilstm_crf")

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# --------------------------------------------------
# MODEL DEFINITION
# --------------------------------------------------

class HierarchicalBiLSTMCRF(nn.Module):
    def __init__(self, vocab_size, num_labels,
                 emb_dim=128, word_hidden=128, sent_hidden=128):
        super().__init__()

        self.embedding = nn.Embedding(vocab_size, emb_dim, padding_idx=0)

        self.word_lstm = nn.LSTM(
            emb_dim, word_hidden,
            bidirectional=True, batch_first=True
        )

        self.sent_lstm = nn.LSTM(
            word_hidden * 2, sent_hidden,
            bidirectional=True, batch_first=True
        )

        self.hidden2tag = nn.Linear(sent_hidden * 2, num_labels)

        self.crf = CRF(num_labels, batch_first=True)

    def decode(self, X, mask):
        B, S, T = X.shape

        # Flatten sentences
        X = X.view(B * S, T)

        emb = self.embedding(X)
        word_out, _ = self.word_lstm(emb)

        # Max pooling over tokens
        sent_vec, _ = torch.max(word_out, dim=1)

        # Restore document shape
        sent_vec = sent_vec.view(B, S, -1)

        doc_out, _ = self.sent_lstm(sent_vec)
        emissions = self.hidden2tag(doc_out)

        return self.crf.decode(emissions, mask=mask)


# --------------------------------------------------
# LOAD MODEL
# --------------------------------------------------

def load_rhetorical_model():
    print("Loading rhetorical model...")

    vocab = joblib.load(os.path.join(RHET_DIR, "vocab.joblib"))
    label_encoder = joblib.load(os.path.join(RHET_DIR, "label_encoder.joblib"))

    model = HierarchicalBiLSTMCRF(
        vocab_size=len(vocab),
        num_labels=len(label_encoder.classes_)
    ).to(DEVICE)

    model.load_state_dict(
        torch.load(
            os.path.join(RHET_DIR, "best_model.pt"),
            map_location=DEVICE
        )
    )

    model.eval()

    return model, vocab, label_encoder


# --------------------------------------------------
# ENCODING FUNCTION
# --------------------------------------------------

def encode_sentences(sentences, vocab, max_tokens=60):

    def encode(sent):
        tokens = re.findall(r"\w+|[^\w\s]", sent.lower(), re.UNICODE)
        ids = [vocab.get(t, vocab.get("<UNK>", 1)) for t in tokens]
        ids = ids[:max_tokens]
        return ids + [0] * (max_tokens - len(ids))

    X = torch.tensor(
        [[encode(s) for s in sentences]],
        dtype=torch.long,
        device=DEVICE
    )

    mask = torch.ones(
        (1, len(sentences)),
        dtype=torch.bool,
        device=DEVICE
    )

    return X, mask


def predict_roles(sentences, model, vocab, label_encoder):
    if not sentences:
        return []
        
    X, mask = encode_sentences(sentences, vocab)

    # Predict roles
    with torch.no_grad():
        preds = model.decode(X, mask)[0]

    # Ensure clean integer indexing
    roles = [label_encoder.classes_[int(p)] for p in preds]
    
    return roles


# --------------------------------------------------
# MAIN
# --------------------------------------------------

def main():

    print("Loading dataset...")

    # Load model
    model, vocab, label_encoder = load_rhetorical_model()

    # Dummy data for testing if no file
    sentences = [
        "The appellant was convicted of murder.",
        "The High Court dismissed the appeal.",
        "The prosecution proved the case beyond reasonable doubt."
    ]

    # Predict roles
    roles = predict_roles(sentences, model, vocab, label_encoder)

    # Print results
    print("\n--- Sentence Role Predictions ---\n")

    for i, (sent, role) in enumerate(zip(sentences, roles)):
        print(f"[{i+1:03d}] {str(role):12} | {sent}")


if __name__ == "__main__":
    main()