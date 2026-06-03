import json

DIR_X = '/Users/recoupable/Documents/projects/mono/strategy/x'

with open(f'{DIR_X}/followers_following.json') as f:
    x_data = json.load(f)

following = [d for d in x_data if d.get('type') == 'following']

# AI influencer keywords - people posting about AI, agents, building in public
ai_keywords = ['ai ', 'ai-', 'artificial intelligence', 'llm', 'agent', 'gpt', 
               'claude', 'openai', 'anthropic', 'machine learning', 'deep learning',
               'generative', 'automation', 'neural', 'transformer', 'build in public',
               'building in public', 'ship', 'founder', 'startup', 'saas']

# Filter for AI-focused accounts with decent followings
ai_influencers = []
for f_item in following:
    desc = (f_item.get('description') or '').lower()
    name = (f_item.get('name') or '').lower()
    followers = f_item.get('followers_count', 0) or 0
    
    if any(kw in desc for kw in ai_keywords) and followers > 5000:
        ai_influencers.append({
            'name': f_item.get('name', ''),
            'handle': f_item.get('screen_name', ''),
            'followers': followers,
            'desc': (f_item.get('description') or '')[:100],
            'verified': f_item.get('verified', False)
        })

ai_influencers.sort(key=lambda x: x['followers'], reverse=True)

print("=" * 70)
print(f"AI INFLUENCER ACCOUNTS SID FOLLOWS ON X ({len(ai_influencers)} accounts)")
print("=" * 70)

# Tier by follower count
tiers = [
    ("🏆 MEGA (1M+)", lambda x: x['followers'] >= 1000000),
    ("🔥 LARGE (100K-1M)", lambda x: 100000 <= x['followers'] < 1000000),
    ("💪 MID (25K-100K)", lambda x: 25000 <= x['followers'] < 100000),
    ("🌱 GROWING (5K-25K)", lambda x: 5000 <= x['followers'] < 25000),
]

for tier_name, tier_filter in tiers:
    tier_accounts = [a for a in ai_influencers if tier_filter(a)]
    if tier_accounts:
        print(f"\n{tier_name} — {len(tier_accounts)} accounts")
        print("-" * 60)
        for a in tier_accounts:
            print(f"  @{a['handle']:25s}  {a['followers']:>10,} followers")
            print(f"    {a['desc']}")
            print()
