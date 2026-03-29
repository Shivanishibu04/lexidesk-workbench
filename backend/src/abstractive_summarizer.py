import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import warnings

class PegasusSummarizer:
    def __init__(self, model_name="nsi319/legal-pegasus"):
        self.tokenizer = None
        self.model = None
        self.model_name = model_name
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
    def load_model(self):
        if self.tokenizer is None or self.model is None:
            print(f"Loading {self.model_name}...")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            
            # 1. SPEED HACK: Load weights directly in half-precision (float16) to process up to 2x faster and use 50% less RAM
            dtype = torch.float16 if torch.cuda.is_available() else torch.float32
            self.model = AutoModelForSeq2SeqLM.from_pretrained(
                self.model_name, 
                torch_dtype=dtype
            ).to(self.device)
            
            self.model.eval()
            print("Model loaded successfully.")
            
    def summarize(self, text, min_length_ratio=0.85, max_length_ratio=1.3):
        self.load_model()
        
        # Tokenize input
        input_tokenized = self.tokenizer.encode(
            text, 
            return_tensors='pt',
            max_length=1024,
            truncation=True
        ).to(self.device)
        
        # Dynamically calculate the target length based on the input text size
        # This prevents the model from hyper-compressing the text, forcing it
        # to rephrase and elaborate instead of just cutting info out.
        input_len = input_tokenized.shape[1]
        calc_min_length = max(50, int(input_len * min_length_ratio))
        calc_max_length = min(1024, int(input_len * max_length_ratio))
        
        # Generate summary (Inside high-performance inference mode)
        with torch.no_grad():
            summary_ids = self.model.generate(
                input_tokenized,
                do_sample=True,              # Enable creative text generation
                temperature=0.75,            # Slight randomness to encourage rephrasing
                top_p=0.92,                  # Nucleus sampling for coherent continuation
                repetition_penalty=1.2,      # Penalize exact looping
                no_repeat_ngram_size=3,
                min_length=calc_min_length,
                max_length=calc_max_length
            )
            
        # Decode and return
        summary = self.tokenizer.decode(
            summary_ids[0], 
            skip_special_tokens=True, 
            clean_up_tokenization_spaces=False
        )
        
        return summary
