"""Build the two-page recruiter résumé from the portfolio's shared content.

Requires reportlab and pypdf. Run from any directory with Python 3.
"""
import json
import shutil
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, HRFlowable, KeepTogether
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'src/content/portfolio.json').read_text())
profile = data['profile']
OUTPUT = ROOT / 'output/pdf/daniel-yu-resume.pdf'
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
INK = colors.HexColor('#202724')
BLUE = colors.HexColor('#254cb6')
MUTED = colors.HexColor('#555e58')

styles = {
    'name': ParagraphStyle('name', fontName='Helvetica-Bold', fontSize=27, leading=31, textColor=INK, spaceAfter=5),
    'role': ParagraphStyle('role', fontName='Helvetica', fontSize=11, leading=15, textColor=BLUE, spaceAfter=8),
    'contact': ParagraphStyle('contact', fontName='Helvetica', fontSize=8.5, leading=12, textColor=MUTED),
    'body': ParagraphStyle('body', fontName='Helvetica', fontSize=9.4, leading=13.2, textColor=INK, spaceAfter=6),
    'section': ParagraphStyle('section', fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=BLUE, spaceBefore=15, spaceAfter=9),
    'job': ParagraphStyle('job', fontName='Helvetica-Bold', fontSize=10.5, leading=14, textColor=INK, spaceAfter=3),
    'meta': ParagraphStyle('meta', fontName='Helvetica', fontSize=8.5, leading=12, textColor=MUTED, spaceAfter=8),
    'bullet': ParagraphStyle('bullet', fontName='Helvetica', fontSize=9.4, leading=13.2, leftIndent=10, firstLineIndent=-10, textColor=INK, spaceAfter=6),
}

def clean(value):
    return escape(value.replace('—', '-').replace('–', '-').replace('’', "'").replace('“', '"').replace('”', '"'))

def p(value, style='body'):
    return Paragraph(value, styles[style])

def bullet(value):
    return p('- ' + clean(value), 'bullet')

def section(title):
    return p(clean(title.upper()), 'section')

def job_heading(job):
    return [p(f"{clean(job['company'])} | {clean(job['role'])}", 'job'), p(f"{clean(job['date'])} &nbsp; / &nbsp; {clean(job['location'])}", 'meta')]

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#d9ded8'))
    canvas.line(48, 39, 564, 39)
    canvas.setFillColor(MUTED)
    canvas.setFont('Helvetica', 8)
    canvas.drawString(48, 26, 'Daniel Yu | Software Engineer')
    canvas.drawRightString(564, 26, f'{doc.page} / 2')
    canvas.restoreState()

story = [p(clean(profile['name']), 'name'), p('Software Engineer | Conversational AI &amp; Full-Stack Systems', 'role')]
contact = f'<link href="mailto:{profile["email"]}" color="#254cb6">{profile["email"]}</link> &nbsp; | &nbsp; {profile["phone"]} &nbsp; | &nbsp; <link href="{profile["website"]}" color="#254cb6">danielyu.app</link>'
social = f'<link href="{profile["linkedin"]}" color="#254cb6">linkedin.com/in/itsyangyu</link> &nbsp; | &nbsp; <link href="{profile["github"]}" color="#254cb6">github.com/kalig0</link>'
story += [p(contact, 'contact'), p(social, 'contact'), Spacer(1, 14), HRFlowable(width='100%', color=colors.HexColor('#d9ded8'), thickness=.5), Spacer(1, 12), p(clean(profile['resumeSummary'])), section('Experience')]
egain = data['experience'][0]
story += job_heading(egain)
story += [bullet(value) for value in egain['bullets'] + egain['resumeDetails']]
story += [PageBreak(), section('Earlier experience')]
for job in data['experience'][1:]:
    story += [KeepTogether(job_heading(job) + [bullet(job['bullets'][0])])]
    story += [bullet(value) for value in job['bullets'][1:]]
    story += [Spacer(1, 5)]
project = data['caseStudies'][2]
story += [section('Selected research'), p('ASSISTments | Educational feedback', 'job'), p(clean(project['date']), 'meta'), bullet(project['contribution']), bullet(project['details'][1])]
story += [section('Education')]
for education in data['education']:
    story += [p(f"{clean(education['school'])} | {clean(education['degree'])}", 'job'), p(f"{clean(education['date'])} &nbsp; / &nbsp; {clean(education['location'])}", 'meta')]
    if education.get('detail'):
        story += [p(clean(education['detail']))]
story += [section('Technical skills')]
for group in data['skills']:
    story += [p(f"<b>{clean(group['label'])}:</b> {clean(', '.join(group['items']))}")]

doc = SimpleDocTemplate(str(OUTPUT), pagesize=letter, rightMargin=48, leftMargin=48, topMargin=42, bottomMargin=51, title='Daniel Yu - Software Engineer', author='Daniel Yu')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
reader = PdfReader(OUTPUT)
assert len(reader.pages) == 2, f'Expected two pages, got {len(reader.pages)}; adjust layout.'
assert all(page.extract_text().strip() for page in reader.pages), 'Résumé must contain selectable text.'
web_output = ROOT / 'public/static/resume.pdf'
web_output.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(OUTPUT, web_output)
print(f'Created {OUTPUT} and web asset ({len(reader.pages)} pages).')
