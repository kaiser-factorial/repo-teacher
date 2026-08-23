import datetime, re, sys, zipfile

z = zipfile.ZipFile(sys.argv[1])
names = z.namelist()
root = names[0].split("/")[0]
text = z.read(f"{root}/SKILL.md").decode()
ok = True

def fail(msg):
    global ok
    ok = False
    print("FAIL:", msg)

if not text.startswith("---\n"):
    fail("SKILL.md has no YAML frontmatter")
fm = text.split("---")[1]

m = re.search(r"^\*\*Last updated: (\d{4}-\d{2}-\d{2})\*\*", text, re.M)
if not m:
    fail("no '**Last updated: YYYY-MM-DD**' line under the H1")
else:
    try:
        stamp = datetime.date.fromisoformat(m.group(1))
        print(f"  last updated: {stamp}")
    except ValueError:
        fail(f"unparseable date: {m.group(1)}")

for field, limit in (("name", 64), ("description", 1024)):
    m = re.search(rf"^{field}: (.*)$", fm, re.M)
    if not m:
        fail(f"frontmatter missing '{field}'")
        continue
    n = len(m.group(1))
    print(f"  {field}: {n}/{limit}")
    if n > limit:
        fail(f"'{field}' is {n} chars, limit {limit}")

# every references/… path SKILL.md mentions must actually be in the bundle
for ref in sorted(set(re.findall(r"references/[\w.-]+", text))):
    if f"{root}/{ref}" not in names:
        fail(f"SKILL.md cites {ref} but it is not in the bundle")

# and nothing in the bundle should be orphaned
for n in names:
    base = n.split("/", 1)[-1]
    if base.startswith("references/") and base not in text:
        print(f"  note: {base} is bundled but never referenced from SKILL.md")

print("PASS" if ok else "FAILED")
sys.exit(0 if ok else 1)
