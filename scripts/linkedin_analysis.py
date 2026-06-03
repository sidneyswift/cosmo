import json
from collections import Counter
from datetime import datetime

with open('/Users/recoupable/Documents/projects/mono/strategy/linkedin/posts_full.json') as f:
    data = json.load(f)

posts = [d for d in data if d.get('type') == 'post']
comments = [d for d in data if d.get('type') == 'comment']
reactions = [d for d in data if d.get('type') == 'reaction']

print("=" * 60)
print("LINKEDIN CONTENT ANALYSIS — Sidney Swift")
print("=" * 60)

# === ENGAGEMENT OVERVIEW ===
total_likes = sum(p.get('engagement', {}).get('likes', 0) for p in posts)
total_comments = sum(p.get('engagement', {}).get('comments', 0) for p in posts)
total_shares = sum(p.get('engagement', {}).get('shares', 0) for p in posts)
print(f"\n📊 TOTALS ACROSS {len(posts)} POSTS:")
print(f"  Likes: {total_likes:,}")
print(f"  Comments: {total_comments:,}")
print(f"  Shares: {total_shares:,}")
print(f"  Avg likes/post: {total_likes/len(posts):.1f}")
print(f"  Avg comments/post: {total_comments/len(posts):.1f}")

# === POSTING FREQUENCY BY MONTH ===
print(f"\n📅 POSTING FREQUENCY (2025+):")
months = Counter()
for p in posts:
    date_str = p.get('postedAt', {}).get('date', '')
    if date_str:
        try:
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            if dt.year >= 2025:
                key = dt.strftime('%Y-%m')
                months[key] += 1
        except:
            pass
for m in sorted(months.keys()):
    bar = '█' * months[m]
    print(f"  {m}: {months[m]:3d} {bar}")

# === TOP 10 POSTS ===
print(f"\n🏆 TOP 10 POSTS BY LIKES:")
sorted_posts = sorted(posts, key=lambda p: p.get('engagement', {}).get('likes', 0), reverse=True)
for i, p in enumerate(sorted_posts[:10], 1):
    eng = p.get('engagement', {})
    content = (p.get('content') or '')[:80].replace('\n', ' ')
    date = p.get('postedAt', {}).get('date', '')[:10]
    print(f"  {i:2d}. [{date}] {eng.get('likes',0):,} likes, {eng.get('comments',0)} comments, {eng.get('shares',0)} shares")
    print(f"      \"{content}...\"")

# === TOP COMMENTERS ===
print(f"\n👥 TOP 15 COMMENTERS (people engaging with your content):")
commenter_counts = Counter()
commenter_info = {}
for c in comments:
    actor = c.get('actor', {})
    name = actor.get('name', 'Unknown')
    if name and name != 'Unknown':
        commenter_counts[name] += 1
        if name not in commenter_info:
            commenter_info[name] = {
                'position': actor.get('position', ''),
                'url': actor.get('linkedinUrl', '')
            }
for name, count in commenter_counts.most_common(15):
    info = commenter_info.get(name, {})
    pos = info.get('position', '')[:50]
    print(f"  {count:3d}x — {name} ({pos})")

# === TOP REACTORS ===
print(f"\n❤️ TOP 15 REACTORS:")
reactor_counts = Counter()
for r in reactions:
    actor = r.get('actor', {})
    name = actor.get('name', 'Unknown')
    if name and name != 'Unknown':
        reactor_counts[name] += 1
for name, count in reactor_counts.most_common(15):
    print(f"  {count:3d}x — {name}")

# === REACTION TYPES ===
print(f"\n🎭 REACTION TYPES BREAKDOWN:")
reaction_types = Counter()
for r in reactions:
    rtype = r.get('reactionType', 'UNKNOWN')
    reaction_types[rtype] += 1
for rtype, count in reaction_types.most_common():
    print(f"  {rtype}: {count}")

# === POSTING DAYS ===
print(f"\n📆 BEST DAYS TO POST (by avg engagement):")
day_engagement = {}
day_counts = Counter()
for p in posts:
    date_str = p.get('postedAt', {}).get('date', '')
    if date_str:
        try:
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            day = dt.strftime('%A')
            likes = p.get('engagement', {}).get('likes', 0)
            day_engagement[day] = day_engagement.get(day, 0) + likes
            day_counts[day] += 1
        except:
            pass
day_order = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
for day in day_order:
    if day in day_counts:
        avg = day_engagement[day] / day_counts[day]
        print(f"  {day:9s}: {avg:6.1f} avg likes ({day_counts[day]} posts)")

# === CONTENT LENGTH ===
print(f"\n📏 CONTENT LENGTH VS ENGAGEMENT:")
short = [p for p in posts if len(p.get('content','') or '') < 200]
medium = [p for p in posts if 200 <= len(p.get('content','') or '') < 800]
long_posts = [p for p in posts if len(p.get('content','') or '') >= 800]
for label, group in [('Short (<200)', short), ('Medium (200-800)', medium), ('Long (800+)', long_posts)]:
    if group:
        avg_l = sum(p.get('engagement',{}).get('likes',0) for p in group)/len(group)
        avg_c = sum(p.get('engagement',{}).get('comments',0) for p in group)/len(group)
        print(f"  {label:20s}: {len(group):3d} posts, {avg_l:.1f} avg likes, {avg_c:.1f} avg comments")

# === YEAR OVER YEAR ===
print(f"\n📈 YEAR OVER YEAR:")
year_data = {}
for p in posts:
    date_str = p.get('postedAt', {}).get('date', '')
    if date_str:
        try:
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            y = dt.year
            if y not in year_data:
                year_data[y] = {'posts': 0, 'likes': 0, 'comments': 0}
            year_data[y]['posts'] += 1
            year_data[y]['likes'] += p.get('engagement', {}).get('likes', 0)
            year_data[y]['comments'] += p.get('engagement', {}).get('comments', 0)
        except:
            pass
for y in sorted(year_data.keys()):
    d = year_data[y]
    print(f"  {y}: {d['posts']} posts, {d['likes']:,} likes, {d['comments']} comments")
