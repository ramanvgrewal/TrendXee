"""Copy the approved taxonomy to each runtime build context."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "taxonomy.json"
targets = [
    ROOT / "trendzy-api/src/main/resources/taxonomy.json",
    ROOT / "trendzy-front/src/lib/taxonomy.json",
]
local_pipeline = ROOT.parent / "TrendZee"
if (local_pipeline / "TrendZY/src/main/resources").is_dir() and (local_pipeline / "trendzy-ai-worker").is_dir():
    targets.extend([
        local_pipeline / "TrendZY/src/main/resources/taxonomy.json",
        local_pipeline / "trendzy-ai-worker/taxonomy.json",
    ])
taxonomy = SOURCE.read_bytes()
for target in targets:
    target.write_bytes(taxonomy)
