import json
from collections import Counter

DIR = '/Users/recoupable/Documents/projects/mono/strategy/linkedin'

# === 1. COMPANY PAGE ANALYSIS ===
print("=" * 60)
print("1. RECOUPABLE COMPANY PAGE")
print("=" * 60)

with open(f'{DIR}/company_posts.json') as f:
    company_data = json.load(f)

company_posts = [d for d in company_data if d.get('type') == 'post']
print(f"\nTotal posts: {len(company_posts)}")

total_likes = sum(p.get('engagement', {}).get('likes', 0) for p in company_posts)
total_comments = sum(p.get('engagement', {}).get('comments', 0) for p in company_posts)
total_shares = sum(p.get('engagement', {}).get('shares', 0) for p in company_posts)
print(f"Total likes: {total_likes}")
print(f"Total comments: {total_comments}")
print(f"Total shares: {total_shares}")
if company_posts:
    print(f"Avg likes/post: {total_likes/len(company_posts):.1f}")
    print(f"Avg comments/post: {total_comments/len(company_posts):.1f}")

print(f"\nCompany posts (all):")
for p in sorted(company_posts, key=lambda x: x.get('engagement', {}).get('likes', 0), reverse=True):
    eng = p.get('engagement', {})
    content = (p.get('content') or '')[:100].replace('\n', ' ')
    date = p.get('postedAt', {}).get('date', '')[:10]
    print(f"  [{date}] {eng.get('likes',0)} likes, {eng.get('comments',0)} comments — \"{content}...\"")

print(f"\n{'='*60}")
print(f"PERSONAL vs COMPANY:")
print(f"  Personal: 416 posts, 9.2 avg likes, 2.1 avg comments")
if company_posts:
    print(f"  Company:  {len(company_posts)} posts, {total_likes/len(company_posts):.1f} avg likes, {total_comments/len(company_posts):.1f} avg comments")

# === 2. SEARCH: WHO'S TALKING ABOUT RECOUPABLE ===
print(f"\n{'='*60}")
print("2. LINKEDIN MENTIONS OF 'RECOUPABLE'")
print("=" * 60)

with open(f'{DIR}/search_recoupable.json') as f:
    search_data = json.load(f)

print(f"\nTotal posts mentioning Recoupable: {len(search_data)}")

# Group by author (exclude Sidney)
author_counts = Counter()
others_posts = []
for p in search_data:
    author = p.get('author', {})
    name = author.get('name', 'Unknown')
    author_counts[name] += 1
    if 'sidney' not in name.lower() and 'swift' not in name.lower():
        others_posts.append(p)

print(f"\nBy Sidney: {len(search_data) - len(others_posts)}")
print(f"By others: {len(others_posts)}")

if others_posts:
    print(f"\nPosts by OTHER people mentioning Recoupable:")
    for p in others_posts[:20]:
        author = p.get('author', {}).get('name', 'Unknown')
        content = (p.get('content') or p.get('commentary') or '')[:120].replace('\n', ' ')
        date = p.get('postedAt', {}).get('date', p.get('postedDate', ''))[:10]
        likes = p.get('engagement', {}).get('likes', p.get('numLikes', 0))
        print(f"  [{date}] {author} ({likes} likes)")
        print(f"    \"{content}...\"")
        print()

# === 3. TOP COMMENTER PROFILES ===
print(f"{'='*60}")
print("3. TOP COMMENTER PROFILES (WARM LEADS)")
print("=" * 60)

with open(f'{DIR}/top_commenters_profiles.json') as f:
    profiles = json.load(f)

# Load comment counts
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
    headline = profile.get('headline', '')[:60]
    location = profile.get('locationName', profile.get('location', {}).get('full', ''))
    followers = profile.get('followerCount', profile.get('followersCount', 'N/A'))
    connections = profile.get('connectionCount', profile.get('connectionsCount', 'N/A'))
    company = ''
    exp = profile.get('experience', profile.get('positions', []))
    if exp and len(exp) > 0:
        company = exp[0].get('companyName', '')
    
    comment_count = cc.get(name, 0)
    
    print(f"\n  {name} ({comment_count}x comments)")
    print(f"    {headline}")
    print(f"    📍 {location} | {followers} followers | {connections} connections")
    if company:
        print(f"    🏢 {company}")
