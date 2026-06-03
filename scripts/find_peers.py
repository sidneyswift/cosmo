import json
from collections import Counter

DIR_LI = '/Users/recoupable/Documents/projects/mono/strategy/linkedin'
DIR_X = '/Users/recoupable/Documents/projects/mono/strategy/x'

# === LINKEDIN: Extract people from your network ===

# 1. People who comment on your posts (most engaged)
with open(f'{DIR_LI}/posts_full.json') as f:
    li_data = json.load(f)

comments = [d for d in li_data if d.get('type') == 'comment']
commenter_data = {}
commenter_counts = Counter()
for c in comments:
    actor = c.get('actor', {})
    name = actor.get('name', '')
    if name and name != 'Sidney Swift':
        commenter_counts[name] += 1
        if name not in commenter_data:
            commenter_data[name] = {
                'position': actor.get('position', ''),
                'url': actor.get('linkedinUrl', ''),
                'type': actor.get('type', '')
            }

# 2. People Sid comments on (who he actively engages with)
with open(f'{DIR_LI}/my_comments.json') as f:
    my_comments = json.load(f)

# Check structure
commented_on = Counter()
commented_on_info = {}
for c in my_comments:
    # Different scrapers have different structures
    author = c.get('postAuthor', c.get('author', {}))
    if isinstance(author, dict):
        name = author.get('name', '')
        url = author.get('linkedinUrl', author.get('url', ''))
    elif isinstance(author, str):
        name = author
        url = ''
    else:
        continue
    if name and name != 'Sidney Swift':
        commented_on[name] += 1
        if name not in commented_on_info:
            commented_on_info[name] = {'url': url}

# 3. Enriched commenter profiles
with open(f'{DIR_LI}/top_commenters_profiles.json') as f:
    commenter_profiles = json.load(f)

# 4. "More profiles" from Sid's profile (LinkedIn's "similar profiles")
with open(f'{DIR_LI}/profile.json') as f:
    profile_data = json.load(f)

similar = []
if isinstance(profile_data, list):
    profile_data = profile_data[0]
more = profile_data.get('moreProfiles', [])
for p in more:
    similar.append({
        'name': f"{p.get('firstName', '')} {p.get('lastName', '')}",
        'url': p.get('linkedinUrl', ''),
        'id': p.get('publicIdentifier', '')
    })

# === X/TWITTER: Who Sid follows (curated list) ===
with open(f'{DIR_X}/followers_following.json') as f:
    x_data = json.load(f)

following = [d for d in x_data if d.get('type') == 'following']

# Filter for music/AI/creator/tech keywords
keywords = ['music', 'ai ', 'artist', 'label', 'creator', 'producer', 'a&r', 
            'songwriter', 'entertainment', 'streaming', 'spotify', 'agent',
            'machine learning', 'generative', 'web3', 'nft', 'founder',
            'ceo', 'startup', 'tech', 'venture', 'distribution']

relevant_following = []
for f_item in following:
    desc = (f_item.get('description') or '').lower()
    name = (f_item.get('name') or '').lower()
    if any(kw in desc or kw in name for kw in keywords):
        relevant_following.append({
            'name': f_item.get('name', ''),
            'handle': f_item.get('screen_name', ''),
            'followers': f_item.get('followers_count', 0),
            'desc': (f_item.get('description') or '')[:80]
        })

relevant_following.sort(key=lambda x: x.get('followers', 0) or 0, reverse=True)

# === OUTPUT ===
print("=" * 70)
print("COMPETITOR & PEER LANDSCAPE — AI x Music x Creator Tech")
print("=" * 70)

print(f"\n{'='*70}")
print("FROM YOUR LINKEDIN — Most Engaged Peers (comment on your posts)")
print("=" * 70)
for name, count in commenter_counts.most_common(25):
    info = commenter_data.get(name, {})
    pos = info.get('position', '')[:60]
    print(f"  {count:3d}x  {name}")
    if pos:
        print(f"        {pos}")

print(f"\n{'='*70}")
print("LINKEDIN 'SIMILAR PROFILES' (LinkedIn thinks these are your peers)")
print("=" * 70)
for p in similar:
    print(f"  {p['name']} — linkedin.com/in/{p['id']}")

print(f"\n{'='*70}")
print("X/TWITTER — Who You Follow (AI/Music/Creator/Tech filtered)")
print(f"({len(relevant_following)} of {len(following)} accounts match)")
print("=" * 70)
for f_item in relevant_following[:40]:
    handle = f_item.get('handle', '')
    followers = f_item.get('followers', 0) or 0
    desc = f_item.get('desc', '')
    fcount = f"{followers:,}" if followers else "?"
    print(f"  @{handle:25s} ({fcount:>10s} followers)")
    if desc:
        print(f"    {desc}")
