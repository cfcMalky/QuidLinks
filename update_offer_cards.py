import os
import re
from pathlib import Path

OFFER_DIR = Path('offers')
CARD_HEADINGS = [
    'Earn with', 'Get', 'How It Works', 'Why Choose', 'Popular', 'Features', 'Goodybags', 'Benefits', 'Details', 'Overview', 'Summary'
]

# Helper: wrap a block in <div class="card"> if not already
CARD_WRAP_RE = re.compile(r'<div class="card"[ >]')

def should_wrap(line):
    return any(h in line for h in CARD_HEADINGS) and not CARD_WRAP_RE.search(line)

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    new_lines = []
    in_card = False
    for i, line in enumerate(lines):
        # Start of a card block
        if should_wrap(line):
            if not in_card:
                new_lines.append('<div class="card">\n')
                in_card = True
        new_lines.append(line)
        # End of a card block (next heading or end of container)
        if in_card and (i+1 == len(lines) or should_wrap(lines[i+1]) or lines[i+1].strip() == '</div>'):
            new_lines.append('</div>\n')
            in_card = False
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

if __name__ == '__main__':
    for file in OFFER_DIR.glob('*.html'):
        process_file(file)
    print('All offer pages updated with consistent .card containers.') 