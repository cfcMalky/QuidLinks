import csv
from pathlib import Path
from bs4 import BeautifulSoup

OFFER_DIR = Path('offers')
OUTPUT_CSV = 'offers_sheet.csv'

FIELDS = [
    'File', 'Offer Name', 'Headline', 'Subheadline', 'Referral Link', 'How It Works', 'Why Choose', 'Features', 'Disclaimer', 'Brand Class'
]

def extract_offer_data(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')
    data = {field: '' for field in FIELDS}
    data['File'] = filepath.name
    # Brand class
    body = soup.find('body')
    if body and body.has_attr('class'):
        data['Brand Class'] = ' '.join(body['class'])
    # Headline
    headline = soup.find(class_='headline')
    if headline:
        data['Headline'] = headline.get_text(strip=True)
    # Subheadline
    subheadline = soup.find(class_='subheadline')
    if subheadline:
        data['Subheadline'] = subheadline.get_text(strip=True)
    # Referral Link (first CTA button)
    cta = soup.find(class_='cta-button')
    if cta and cta.has_attr('href'):
        data['Referral Link'] = cta['href']
    # Offer Name (from title or headline)
    title = soup.find('title')
    if title:
        data['Offer Name'] = title.get_text(strip=True)
    elif headline:
        data['Offer Name'] = headline.get_text(strip=True)
    # How It Works (all mini-card titles/descs in How It Works card)
    how_card = None
    for card in soup.find_all(class_='card'):
        if card.find(string=lambda s: s and 'How It Works' in s):
            how_card = card
            break
    if how_card:
        steps = []
        for mini in how_card.find_all(class_='mini-card'):
            title = mini.find(class_='title')
            desc = mini.find(class_='desc')
            if title and desc:
                steps.append(f"{title.get_text(strip=True)}: {desc.get_text(strip=True)}")
        data['How It Works'] = ' | '.join(steps)
    # Why Choose (all mini-card titles/descs in Why Choose card)
    why_card = None
    for card in soup.find_all(class_='card'):
        if card.find(string=lambda s: s and 'Why Choose' in s):
            why_card = card
            break
    if why_card:
        why = []
        for mini in why_card.find_all(class_='mini-card'):
            title = mini.find(class_='title')
            desc = mini.find(class_='desc')
            if title and desc:
                why.append(f"{title.get_text(strip=True)}: {desc.get_text(strip=True)}")
        data['Why Choose'] = ' | '.join(why)
    # Features/Benefits (all mini-card titles/descs in Features/Benefits/Popular card)
    features_card = None
    for card in soup.find_all(class_='card'):
        if card.find(string=lambda s: s and ('Feature' in s or 'Benefit' in s or 'Popular' in s)):
            features_card = card
            break
    if features_card:
        feats = []
        for mini in features_card.find_all(class_='mini-card'):
            title = mini.find(class_='title')
            desc = mini.find(class_='desc')
            if title and desc:
                feats.append(f"{title.get_text(strip=True)}: {desc.get_text(strip=True)}")
        data['Features'] = ' | '.join(feats)
    # Disclaimer (last card with small text)
    disclaimer = ''
    for card in soup.find_all(class_='card'):
        if card.get('style') and 'font-size' in card.get('style'):
            disclaimer = card.get_text(strip=True)
    data['Disclaimer'] = disclaimer
    return data

def main():
    rows = []
    for file in OFFER_DIR.glob('*.html'):
        rows.append(extract_offer_data(file))
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    print(f'Extracted offer data to {OUTPUT_CSV}')

if __name__ == '__main__':
    main() 