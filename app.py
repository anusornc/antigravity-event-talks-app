import re
import urllib.request
import feedparser
from flask import Flask, render_template, jsonify

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def strip_html(html_str):
    """Simple helper to strip HTML tags for plain text summary (e.g. for tweets)."""
    # Replace links with their text representation
    text = re.sub(r'<a[^>]*>(.*?)</a>', r'\1', html_str)
    # Remove all other tags
    text = re.sub(r'<[^>]+>', '', text)
    # Decode basic HTML entities
    text = (text.replace('&nbsp;', ' ')
                .replace('&amp;', '&')
                .replace('&lt;', '<')
                .replace('&gt;', '>')
                .replace('&quot;', '"')
                .replace('&#39;', "'")
                .replace('&apos;', "'"))
    # Collapse multiple whitespaces/newlines
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def parse_release_notes():
    """Fetch the feed and parse it into structured updates."""
    try:
        # Fetch using urllib to avoid requests dependency issues, feedparser handles the string/bytes
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        req = urllib.request.Request(FEED_URL, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as response:
            feed_data = response.read()
            
        feed = feedparser.parse(feed_data)
        
        parsed_entries = []
        for entry in feed.entries:
            date_str = entry.title
            link = entry.link
            updated = entry.get('updated', '')
            
            # Extract content. Atom feed content is usually in entry.content[0].value
            content_val = ""
            if 'content' in entry and len(entry.content) > 0:
                content_val = entry.content[0].value
            elif 'summary' in entry:
                content_val = entry.summary
                
            # Parse individual updates inside this entry's content
            # The feed content is structured with <h3>Category</h3> followed by <p>s/<ul>s
            parts = re.split(r'<h3>(.*?)</h3>', content_val)
            
            updates = []
            if len(parts) > 1:
                # parts[0] is content before the first h3 (usually empty or intro)
                for i in range(1, len(parts), 2):
                    if i + 1 < len(parts):
                        category = parts[i].strip()
                        body_html = parts[i+1].strip()
                        
                        plain_text = strip_html(body_html)
                        
                        updates.append({
                            "category": category,
                            "body_html": body_html,
                            "plain_text": plain_text
                        })
            else:
                # Fallback if no <h3> tags are found, treat the whole content as one update
                plain_text = strip_html(content_val)
                if plain_text:
                    updates.append({
                        "category": "General",
                        "body_html": content_val,
                        "plain_text": plain_text
                    })
            
            parsed_entries.append({
                "date": date_str,
                "updated": updated,
                "link": link,
                "updates": updates
            })
            
        return {
            "success": True,
            "entries": parsed_entries,
            "feed_title": feed.feed.get('title', 'BigQuery Release Notes'),
            "feed_updated": feed.feed.get('updated', '')
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    result = parse_release_notes()
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=True)
