import re

def check_balance(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Simple check for matching pairs of {!isSCStaff && ( ... )}
    starts = len(re.findall(r'\{!isSCStaff && \(', content))
    ends = len(re.findall(r'\)\}', content))

    # Note: this is very naive as )} might be used elsewhere.
    # Let's count them specifically in the context of our additions.

    print(f"File: {filepath}")
    print(f"  Starts: {starts}")
    print(f"  Ends: {ends}")

    # Check for Card tags
    card_opens = len(re.findall(r'<Card', content))
    card_closes = len(re.findall(r'</Card>', content))
    print(f"  Card tags: <Card {card_opens}, </Card> {card_closes}")

    # Check for div tags
    div_opens = len(re.findall(r'<div', content))
    div_closes = len(re.findall(r'</div', content))
    print(f"  div tags: <div {div_opens}, </div {div_closes}")

check_balance('app/(protected)/dashboard/page.jsx')
