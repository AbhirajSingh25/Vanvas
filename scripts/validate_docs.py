#!/usr/bin/env python3
"""
VANVAS Context & Documentation Validation Script
Validates the presence, required sections, commit consistency, and secret-free status
of all permanent project context files.
"""

import os
import re
import subprocess
import sys
from pathlib import Path

REQUIRED_DOCS = {
    "PROJECT_CONTEXT.md": [
        "Product Identity & Vision",
        "Complete Project Architecture",
        "Web Frontend Architecture",
        "Native Mobile Architecture",
        "Backend Architecture",
        "Authentication & Authorization",
        "Shared Package & Design Tokens",
        "Third-Party Integrations",
        "Deployment Architecture",
        "Core Product Features & Implementation Status",
        "Offline Functionality",
        "Testing Infrastructure",
        "Current Git Branch",
        "Known Issues",
        "Important Directories",
        "Environment Variables",
        "Non-Negotiable Product",
    ],
    "CURRENT_STATE.md": [
        "Git State & Checkpoint",
        "Production Status",
        "Build & Diagnostics Verification",
        "Test Suite Summary",
        "Active Issues & Blockers",
        "Last Completed Task",
        "Next Recommended Task",
    ],
    "DEVELOPMENT_LOG.md": [
        "Chronological Development Log",
    ],
    "DECISIONS.md": [
        "Permanent Architectural & Product Decisions",
        "Product Identity",
        "Visual Identity",
        "Dual-Platform Equivalence",
        "Universal Single-Row Touch Carousels",
    ],
    "NEXT_SESSION.md": [
        "Context at a Glance",
        "Unresolved Issues & State",
        "Exact Tasks for the Next Session",
        "Verification Commands",
        "Acceptance Criteria",
    ],
    "AI_INSTRUCTIONS.md": [
        "Permanent Instructions for AI Coding Assistants",
        "Golden Rules of Engagement",
    ],
    "NEW_CHAT_PROMPT.md": [
        "New Chat Session Starter Prompt",
    ],
}

SUSPICIOUS_PATTERNS = [
    re.compile(r"-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"sk-[a-zA-Z0-9]{32,}"),
    re.compile(r"AIzaSy[a-zA-Z0-9_-]{33}"),
    re.compile(r"ghp_[a-zA-Z0-9]{36}"),
]


def check_git_commit(root_dir: Path) -> str:
    try:
        res = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=str(root_dir),
            capture_output=True,
            text=True,
            check=True,
        )
        return res.stdout.strip()[:7]
    except Exception:
        return ""


def validate_documentation(root_dir: Path) -> bool:
    print("=== VANVAS Project Context Validation ===")
    errors = []
    current_head_short = check_git_commit(root_dir)
    print(f"Current Git HEAD Checkpoint: {current_head_short or 'Unknown'}")

    for doc_name, required_headings in REQUIRED_DOCS.items():
        doc_path = root_dir / doc_name
        if not doc_path.exists():
            errors.append(f"MISSING FILE: {doc_name}")
            continue

        content = doc_path.read_text(encoding="utf-8")
        print(f"Checking {doc_name} ({len(content)} chars)...")

        # 1. Check headings
        for heading in required_headings:
            if heading.lower() not in content.lower():
                errors.append(f"{doc_name}: Missing expected section or heading containing '{heading}'")

        # 2. Check for secret leakage
        for pattern in SUSPICIOUS_PATTERNS:
            if pattern.search(content):
                errors.append(f"{doc_name}: Potential credential or secret pattern detected!")

        # 3. Check commit reference consistency if HEAD is known
        if current_head_short and doc_name in ["PROJECT_CONTEXT.md", "CURRENT_STATE.md"]:
            if current_head_short not in content:
                print(f"  [NOTE] {doc_name} does not reference current short HEAD {current_head_short} (may be updated upon commit).")

    print("\n--- Summary ---")
    if errors:
        print(f"FAILED with {len(errors)} error(s):")
        for err in errors:
            print(f"  ❌ {err}")
        return False
    else:
        print("✅ All 7 context files exist, contain required sections, and are free of leaked secrets!")
        return True


if __name__ == "__main__":
    repo_root = Path(__file__).resolve().parent.parent
    success = validate_documentation(repo_root)
    sys.exit(0 if success else 1)
