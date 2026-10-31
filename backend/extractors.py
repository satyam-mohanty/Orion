"""
Orion Document & Media Extractors
Handles robust extraction for:
- Websites / URLs (trafilatura + BeautifulSoup)
- YouTube Videos & Transcripts (youtube-transcript-api + oEmbed)
- Word Documents (.docx via python-docx)
- E-Books / EPUBs (.epub via ebooklib)
- PDFs (.pdf via pypdf)
"""

import io
import os
import re
import tempfile
import urllib.parse
import zipfile
from typing import Dict, Any, Optional
import requests
from bs4 import BeautifulSoup

# Trafilatura for clean web extraction
try:
    import trafilatura
except ImportError:
    trafilatura = None

# YouTube Transcript API
try:
    from youtube_transcript_api import YouTubeTranscriptApi
except ImportError:
    YouTubeTranscriptApi = None

# Python DOCX
try:
    import docx
except ImportError:
    docx = None

# EBookLib
try:
    import ebooklib
    from ebooklib import epub
except ImportError:
    ebooklib = None
    epub = None

# PyPDF
try:
    import pypdf
except ImportError:
    pypdf = None


USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"


def extract_website(url: str) -> Dict[str, Any]:
    """
    Extracts readable text and title from a webpage URL.
    """
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    headers = {"User-Agent": USER_AGENT}
    title = ""
    content = ""

    # Strategy 1: Trafilatura (highest quality text extraction without boilerplate)
    if trafilatura:
        try:
            downloaded = trafilatura.fetch_url(url)
            if downloaded:
                extracted = trafilatura.extract(
                    downloaded,
                    include_formatting=True,
                    include_links=False,
                    favor_precision=True
                )
                if extracted and len(extracted.strip()) > 50:
                    content = extracted.strip()

                # Extract title from raw HTML
                soup = BeautifulSoup(downloaded, "html.parser")
                if soup.title and soup.title.string:
                    title = soup.title.string.strip()
                elif soup.find("meta", property="og:title"):
                    og = soup.find("meta", property="og:title")
                    title = og.get("content", "").strip() if og else ""
        except Exception as e:
            print(f"Trafilatura extraction warning for {url}: {e}")

    # Strategy 2: Fallback to requests + BeautifulSoup
    if not content:
        try:
            resp = requests.get(url, headers=headers, timeout=12)
            resp.raise_for_status()
            html = resp.text
            soup = BeautifulSoup(html, "html.parser")

            if not title:
                if soup.title and soup.title.string:
                    title = soup.title.string.strip()
                elif soup.find("h1"):
                    title = soup.find("h1").get_text().strip()

            # Remove unwanted tags
            for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "aside", "svg", "iframe", "form"]):
                tag.decompose()

            # Find main article or body
            main_el = soup.find("main") or soup.find("article") or soup.find("body")
            if main_el:
                lines = [p.get_text().strip() for p in main_el.find_all(["p", "h1", "h2", "h3", "h4", "li"]) if p.get_text().strip()]
                content = "\n\n".join(lines)
            else:
                content = soup.get_text(separator="\n", strip=True)
        except Exception as e:
            raise ValueError(f"Failed to fetch content from {url}: {str(e)}")

    if not title:
        parsed = urllib.parse.urlparse(url)
        title = parsed.hostname.replace("www.", "") if parsed.hostname else "Web Resource"
        if parsed.path and len(parsed.path) > 1:
            title += " " + parsed.path.strip("/").replace("-", " ").replace("_", " ").title()

    if not content or len(content.strip()) < 10:
        raise ValueError(f"Could not extract meaningful readable content from {url}. The page may require login, cookies, or JavaScript.")

    return {
        "title": title[:200],
        "content": content,
        "url": url,
        "word_count": len(content.split())
    }


def extract_youtube_video_id(url: str) -> Optional[str]:
    """
    Parses video ID from YouTube watch URLs, short URLs, embeds, or shorts.
    """
    url = url.strip()
    parsed = urllib.parse.urlparse(url)

    if "youtu.be" in parsed.netloc:
        return parsed.path.lstrip("/").split("?")[0]
    
    if "youtube.com" in parsed.netloc:
        if parsed.path == "/watch":
            queries = urllib.parse.parse_qs(parsed.query)
            return queries.get("v", [None])[0]
        elif "/shorts/" in parsed.path:
            return parsed.path.split("/shorts/")[1].split("/")[0].split("?")[0]
        elif "/embed/" in parsed.path:
            return parsed.path.split("/embed/")[1].split("/")[0].split("?")[0]
        elif "/v/" in parsed.path:
            return parsed.path.split("/v/")[1].split("/")[0].split("?")[0]
        elif parsed.query:
            queries = urllib.parse.parse_qs(parsed.query)
            if "v" in queries:
                return queries["v"][0]

    # Handle raw 11-char video IDs directly
    if re.match(r"^[a-zA-Z0-9_-]{11}$", url):
        return url

    return None


def extract_youtube(url: str) -> Dict[str, Any]:
    """
    Extracts transcript and metadata for a YouTube video.
    """
    video_id = extract_youtube_video_id(url)
    if not video_id:
        raise ValueError(f"Invalid YouTube URL: '{url}'. Please provide a valid YouTube video link.")

    title = f"YouTube Video ({video_id})"
    channel = "YouTube Creator"
    description = ""

    # Fetch title & author from YouTube oEmbed API
    try:
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        oembed_res = requests.get(oembed_url, timeout=6)
        if oembed_res.status_code == 200:
            data = oembed_res.json()
            title = data.get("title", title)
            channel = data.get("author_name", channel)
    except Exception as e:
        print(f"YouTube oEmbed lookup notice for {video_id}: {e}")

    # Fetch transcript
    transcript_text = ""
    if YouTubeTranscriptApi:
        try:
            api = YouTubeTranscriptApi()
            transcript_list = None
            try:
                transcript_list = api.fetch(video_id, languages=["en", "en-US", "en-GB"])
            except Exception:
                # Try finding any available transcript
                try:
                    listing = api.list(video_id)
                    for t in listing:
                        try:
                            transcript_list = t.fetch()
                            break
                        except Exception:
                            continue
                except Exception:
                    pass

            if transcript_list:
                formatted_lines = []
                current_paragraph = []
                last_time = 0

                for item in transcript_list:
                    # FetchedTranscriptSnippet objects have .text and .start
                    text_snip = getattr(item, "text", "") if hasattr(item, "text") else item.get("text", "")
                    start_time = getattr(item, "start", 0) if hasattr(item, "start") else item.get("start", 0)

                    # Group lines every ~30 seconds for readable study paragraphs
                    if start_time - last_time > 30 and current_paragraph:
                        minutes = int(last_time // 60)
                        seconds = int(last_time % 60)
                        timestamp_str = f"[{minutes:02d}:{seconds:02d}]"
                        formatted_lines.append(f"{timestamp_str} {' '.join(current_paragraph)}")
                        current_paragraph = [text_snip]
                        last_time = start_time
                    else:
                        if not current_paragraph:
                            last_time = start_time
                        current_paragraph.append(text_snip)

                if current_paragraph:
                    minutes = int(last_time // 60)
                    seconds = int(last_time % 60)
                    timestamp_str = f"[{minutes:02d}:{seconds:02d}]"
                    formatted_lines.append(f"{timestamp_str} {' '.join(current_paragraph)}")

                transcript_text = "\n\n".join(formatted_lines)
        except Exception as transcript_err:
            print(f"YouTube transcript extraction error for {video_id}: {transcript_err}")

    if not transcript_text:
        # Fallback if transcript is disabled on the video
        transcript_text = (
            f"# {title}\n\n"
            f"**Creator / Channel**: {channel}\n"
            f"**Video Link**: https://www.youtube.com/watch?v={video_id}\n\n"
            f"> [Notice] Subtitles or closed-captions are unavailable or disabled by the author for this specific video. "
            f"Video metadata has been registered in the notebook."
        )

    return {
        "title": title[:200],
        "content": transcript_text,
        "channel": channel,
        "video_id": video_id,
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "word_count": len(transcript_text.split())
    }


def extract_docx(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Extracts structured text from a Microsoft Word (.docx) document.
    """
    if not docx:
        raise ValueError("python-docx is not installed in the environment.")

    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        paragraphs = []
        for p in doc.paragraphs:
            text = p.text.strip()
            if text:
                # Add markdown headers for Word heading styles
                if p.style.name.startswith("Heading 1"):
                    paragraphs.append(f"# {text}")
                elif p.style.name.startswith("Heading 2"):
                    paragraphs.append(f"## {text}")
                elif p.style.name.startswith("Heading 3"):
                    paragraphs.append(f"### {text}")
                else:
                    paragraphs.append(text)

        # Also extract table text
        for table in doc.tables:
            table_rows = []
            for row in table.rows:
                row_cells = [cell.text.strip().replace("\n", " ") for cell in row.cells]
                if any(row_cells):
                    table_rows.append(" | ".join(row_cells))
            if table_rows:
                paragraphs.append("\n".join(table_rows))

        full_text = "\n\n".join(paragraphs).strip()
        if not full_text:
            full_text = f"Document: {filename} (No readable text paragraphs found)."

        return {
            "title": filename,
            "content": full_text,
            "type": "docx",
            "word_count": len(full_text.split())
        }
    except Exception as e:
        raise ValueError(f"Failed to parse Word document ({filename}): {str(e)}")


def extract_epub(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Extracts text chapters and metadata from an EPUB E-Book.
    Supports ebooklib with automatic zipfile/BeautifulSoup fallback for robustness.
    """
    book_title = filename.replace(".epub", "").replace("_", " ").title()
    author = ""
    chapters = []

    # Attempt 1: Standard ebooklib parser
    if epub:
        try:
            # Write to a temp file since ebooklib handles file paths more reliably
            with tempfile.NamedTemporaryFile(suffix=".epub", delete=False) as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name

            try:
                book = epub.read_epub(tmp_path)
                title_meta = book.get_metadata("DC", "title")
                if title_meta and title_meta[0]:
                    book_title = str(title_meta[0][0])
                creator_meta = book.get_metadata("DC", "creator")
                if creator_meta and creator_meta[0]:
                    author = str(creator_meta[0][0])

                if author:
                    chapters.append(f"**Author**: {author}\n")

                for item in book.get_items():
                    if item.get_type() == ebooklib.ITEM_DOCUMENT:
                        soup = BeautifulSoup(item.get_content(), "html.parser")
                        for s in soup(["script", "style"]):
                            s.decompose()
                        text = soup.get_text(separator="\n", strip=True)
                        if text and len(text) > 30:
                            chapters.append(text)
            finally:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
        except Exception as e:
            # ebooklib failed on spine/ncx, proceed to zipfile fallback
            chapters = []

    # Attempt 2: Fallback to reading EPUB as a ZIP archive directly
    if not chapters:
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
                # Find OPF for metadata if available
                opf_files = [n for n in z.namelist() if n.endswith(".opf")]
                if opf_files:
                    try:
                        opf_soup = BeautifulSoup(z.read(opf_files[0]), "xml")
                        t = opf_soup.find("dc:title")
                        if t and t.string:
                            book_title = t.string.strip()
                        c = opf_soup.find("dc:creator")
                        if c and c.string:
                            author = c.string.strip()
                    except Exception:
                        pass

                if author:
                    chapters.append(f"**Author**: {author}\n")

                # Extract all xhtml/html documents in archive
                doc_files = [n for n in z.namelist() if n.lower().endswith((".xhtml", ".html", ".htm")) and "toc" not in n.lower()]
                # Sort alphabetically to maintain chapter order
                doc_files.sort()

                for df in doc_files:
                    try:
                        raw_html = z.read(df)
                        soup = BeautifulSoup(raw_html, "html.parser")
                        for s in soup(["script", "style"]):
                            s.decompose()
                        text = soup.get_text(separator="\n", strip=True)
                        if text and len(text) > 30:
                            chapters.append(text)
                    except Exception:
                        continue
        except Exception as zip_err:
            raise ValueError(f"Failed to parse EPUB file ({filename}): {str(zip_err)}")

    full_text = "\n\n---\n\n".join(chapters).strip()
    if not full_text:
        full_text = f"E-Book: {book_title} (No readable chapter text found)."

    return {
        "title": book_title[:200],
        "content": full_text,
        "author": author,
        "type": "epub",
        "word_count": len(full_text.split())
    }


def extract_pdf(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Extracts text from PDF using pypdf.
    """
    if not pypdf:
        raise ValueError("pypdf is not installed.")

    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        pages_text = []
        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            text = text.strip()
            if text:
                pages_text.append(f"[Page {idx + 1}]\n{text}")

        full_text = "\n\n".join(pages_text).strip()
        if not full_text:
            full_text = f"PDF Document: {filename} (No text layer found; this may be a scanned image PDF)."

        return {
            "title": filename,
            "content": full_text,
            "type": "pdf",
            "num_pages": len(reader.pages),
            "word_count": len(full_text.split())
        }
    except Exception as e:
        raise ValueError(f"Failed to parse PDF document ({filename}): {str(e)}")
