import json

DIR = '/Users/recoupable/Documents/projects/mono/strategy/linkedin'

with open(f'{DIR}/search_recoupable.json') as f:
    search_data = json.load(f)

print("=" * 60)
print("LINKEDIN MENTIONS OF 'RECOUPABLE'")
print("=" * 60)
print(f"\nTotal posts found: {len(search_data)}")

# Separate Sidney's posts from others
others = []
sids = []
for p in search_data:
    author_name = p.get('author', {}).get('name', '')
    if 'sidney' in author_name.lower() or 'swift' in author_name.lower():
        sids.append(p)
    else:
        others.append(p)

print(f"By Sidney: {len(sids)}")
print(f"By others: {len(others)}")

if others:
    print(f"\n--- POSTS BY OTHERS MENTIONING RECOUPABLE ---\n")
    for p in others[:25]:
        author = p.get('author', {}).get('name', 'Unknown')
        author_headline = p.get('author', {}).get('headline', '')[:50]
        text = (p.get('text') or '')[:150].replace('\n', ' ')
        posted_at = p.get('posted_at', {})
        date = posted_at.get('date', '')[:10] if isinstance(posted_at, dict) else str(posted_at)[:10]
        stats = p.get('stats', {})
        likes = stats.get('total_reactions', 0)
        comments = stats.get('comments', 0)
        print(f"  [{date}] {author}")
        print(f"    {author_headline}")
        print(f"    {likes} likes, {comments} comments")
        print(f"    \"{text}...\"")
        print()

# === COMMENTER PROFILES ===
print("=" * 60)
print("TOP COMMENTER PROFILES (WARM LEADS)")
print("=" * 60)

with open(f'{DIR}/top_commenters_profiles.json') as f:
    profiles = json.load(f)

from collections import Counter
with open(f'{DIR}/posts_full.json') as f:
    all_data = json.load(f)
all_comments = [d for d in all_data if d.get('type') == 'comment']
cc = Counter()
for c in all_comments:
    actor = c.get('actor', {})
    name = actor.get('name', 'Unknown')
    if name != 'Unknown' and name != 'Sidney Swift':
        cc[name] += 1

for profile in profiles:
    name = profile.get('fullName', 'Unknown')
    headline = profile.get('headline', '')[:70]
    location = profile.get('locationName', '')
    followers = profile.get('followerCount', 'N/A')
    connections = profile.get('connectionCount', 'N/A')
    
    exp = profile.get('experience', [])
    company = exp[0].get('companyName', '') if exp else ''
    position = exp[0].get('position', '') if exp else ''
    
    comment_count = cc.get(name, 0)
    
    print(f"\n  {name} ({comment_count}x comments on your posts)")
    print(f"    {headline}")
    print(f"    📍 {location} | {followers} followers | {connections} connections")
    if company:
        print(f"    🏢 {position} @ {company}")
