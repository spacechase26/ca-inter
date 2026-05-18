"""
Catalogue of ICAI CA Inter Group 2 PDFs to pull into the local PDF library.

Shared by:
  - scripts/fetch-icai-pdfs.py  (downloader)
  - scripts/seed-pdfs-tab.py    (CSV emitter for Sheet bootstrap)

Edition: "May 2026 onwards" (applies to Sep 2026 + Jan 2027 attempts under NSET).
Source pages on icai.org:
  - https://www.icai.org/post/sm-inter-p4-may2026
  - https://www.icai.org/post/sm-inter-p5-may2026
  - https://www.icai.org/post/sm-inter-p6a-may2026
  - https://www.icai.org/post/sm-inter-p6b-may2026
  - https://www.icai.org/post/rtp-intermediate-course-may2026  (and similar for older attempts)
  - https://www.icai.org/post/question-papers-intermediate-course
"""
from typing import NamedTuple, Optional

CDN = "https://resource.cdn.icai.org/"


class Pdf(NamedTuple):
    category: str        # "ICAI Study Material" | "RTP" | "QP"
    paper: str           # "P4" | "P5" | "P6A" | "P6B" | "P6" (combined)
    chapter: Optional[str]  # "1", "2", ..., "9-I", or None for paper-wide
    title: str
    url: str
    local_path: str      # relative to public/pdfs/
    notes: str = ""

    @property
    def filename(self) -> str:
        return self.local_path.split("/")[-1]


# --------------------------------------------------------------------------
# Paper 4 — Cost & Management Accounting
# --------------------------------------------------------------------------
P4_STUDY = [
    Pdf("ICAI Study Material", "P4", None, "Initial Pages — Module 1",
        CDN + "87788bos-aps2161-ip-m1.pdf",
        "icai/study-material/p4-costing/ip-m1.pdf", "Front matter, syllabus, index"),
    Pdf("ICAI Study Material", "P4", "1",  "Introduction to Cost & Management Accounting",
        CDN + "87789bos-aps2161-ch1.pdf",
        "icai/study-material/p4-costing/ch01.pdf"),
    Pdf("ICAI Study Material", "P4", "2",  "Material Cost",
        CDN + "87790bos-aps2161-ch2.pdf",
        "icai/study-material/p4-costing/ch02.pdf"),
    Pdf("ICAI Study Material", "P4", "3",  "Employee Cost & Direct Expenses",
        CDN + "87791bos-aps2161-ch3.pdf",
        "icai/study-material/p4-costing/ch03.pdf"),
    Pdf("ICAI Study Material", "P4", "4",  "Overheads — Absorption Costing",
        CDN + "87792bos-aps2161-ch4.pdf",
        "icai/study-material/p4-costing/ch04.pdf"),
    Pdf("ICAI Study Material", "P4", "5",  "Activity Based Costing",
        CDN + "87793bos-aps2161-ch5.pdf",
        "icai/study-material/p4-costing/ch05.pdf"),
    Pdf("ICAI Study Material", "P4", "6",  "Cost Sheet",
        CDN + "87794bos-aps2161-ch6.pdf",
        "icai/study-material/p4-costing/ch06.pdf"),
    Pdf("ICAI Study Material", "P4", "7",  "Cost Accounting Systems",
        CDN + "87795bos-aps2161-ch7.pdf",
        "icai/study-material/p4-costing/ch07.pdf"),
    Pdf("ICAI Study Material", "P4", None, "Initial Pages — Module 2",
        CDN + "87796bos-aps2161-ip-m2.pdf",
        "icai/study-material/p4-costing/ip-m2.pdf"),
    Pdf("ICAI Study Material", "P4", "8",  "Unit & Batch Costing",
        CDN + "87797bos-aps2161-ch8.pdf",
        "icai/study-material/p4-costing/ch08.pdf"),
    Pdf("ICAI Study Material", "P4", "9",  "Job Costing",
        CDN + "87798bos-aps2161-ch9.pdf",
        "icai/study-material/p4-costing/ch09.pdf"),
    Pdf("ICAI Study Material", "P4", "10", "Process & Operation Costing",
        CDN + "87799bos-aps2161-ch10.pdf",
        "icai/study-material/p4-costing/ch10.pdf"),
    Pdf("ICAI Study Material", "P4", "11", "Joint Products & By-Products",
        CDN + "87800bos-aps2161-ch11.pdf",
        "icai/study-material/p4-costing/ch11.pdf"),
    Pdf("ICAI Study Material", "P4", "12", "Service Costing",
        CDN + "87801bos-aps2161-ch12.pdf",
        "icai/study-material/p4-costing/ch12.pdf"),
    Pdf("ICAI Study Material", "P4", "13", "Standard Costing",
        CDN + "87802bos-aps2161-ch13.pdf",
        "icai/study-material/p4-costing/ch13.pdf"),
    Pdf("ICAI Study Material", "P4", "14", "Marginal Costing",
        CDN + "87803bos-aps2161-ch14.pdf",
        "icai/study-material/p4-costing/ch14.pdf"),
    Pdf("ICAI Study Material", "P4", "15", "Budgets & Budgetary Control",
        CDN + "87804bos-aps2161-ch15.pdf",
        "icai/study-material/p4-costing/ch15.pdf"),
]

# --------------------------------------------------------------------------
# Paper 5 — Auditing & Ethics
# --------------------------------------------------------------------------
P5_STUDY = [
    Pdf("ICAI Study Material", "P5", None, "Initial Pages — Module 1",
        CDN + "87755bos280825-ip-5.pdf",
        "icai/study-material/p5-audit/ip-m1.pdf"),
    Pdf("ICAI Study Material", "P5", "1",  "Nature, Objective & Scope of Audit",
        CDN + "87756bos280825-ch1a.pdf",
        "icai/study-material/p5-audit/ch01.pdf"),
    Pdf("ICAI Study Material", "P5", "2",  "Audit Strategy, Audit Planning & Audit Programme",
        CDN + "87757bos280825-ch2a.pdf",
        "icai/study-material/p5-audit/ch02.pdf"),
    Pdf("ICAI Study Material", "P5", "3",  "Risk Assessment & Internal Control",
        CDN + "87758bos280825-ch3a.pdf",
        "icai/study-material/p5-audit/ch03.pdf"),
    Pdf("ICAI Study Material", "P5", "4",  "Audit Evidence",
        CDN + "87759bos280825-ch4a.pdf",
        "icai/study-material/p5-audit/ch04.pdf"),
    Pdf("ICAI Study Material", "P5", "5",  "Audit of Items of Financial Statements",
        CDN + "87760bos280825-ch5a.pdf",
        "icai/study-material/p5-audit/ch05.pdf", "~18% paper weightage"),
    Pdf("ICAI Study Material", "P5", None, "Initial Pages — Module 2",
        CDN + "87761bos280528a-im2.pdf",
        "icai/study-material/p5-audit/ip-m2.pdf"),
    Pdf("ICAI Study Material", "P5", "6",  "Audit Documentation",
        CDN + "87762bos280825-ch6a.pdf",
        "icai/study-material/p5-audit/ch06.pdf"),
    Pdf("ICAI Study Material", "P5", "7",  "Completion & Review",
        CDN + "87763bos280825-ch7a.pdf",
        "icai/study-material/p5-audit/ch07.pdf"),
    Pdf("ICAI Study Material", "P5", "8",  "Audit Report",
        CDN + "87764bos280825-ch8a.pdf",
        "icai/study-material/p5-audit/ch08.pdf"),
    Pdf("ICAI Study Material", "P5", "9",  "Special Features of Audit of Different Types of Entities",
        CDN + "87765bos280825-ch9a.pdf",
        "icai/study-material/p5-audit/ch09.pdf"),
    Pdf("ICAI Study Material", "P5", "10", "Audit of Banks",
        CDN + "87766bos280825-ch10a.pdf",
        "icai/study-material/p5-audit/ch10.pdf"),
    Pdf("ICAI Study Material", "P5", "11", "Ethics & Terms of Audit Engagements",
        CDN + "87767bos280825-ch11a.pdf",
        "icai/study-material/p5-audit/ch11.pdf"),
]

# --------------------------------------------------------------------------
# Paper 6A — Financial Management
# --------------------------------------------------------------------------
P6A_STUDY = [
    Pdf("ICAI Study Material", "P6A", None, "Initial Pages — Module 1",
        CDN + "87736bos-28082025-ip.pdf",
        "icai/study-material/p6a-fm/ip-m1.pdf"),
    Pdf("ICAI Study Material", "P6A", "1",  "Scope & Objectives of Financial Management",
        CDN + "87737bos280825-ch1.pdf",
        "icai/study-material/p6a-fm/ch01.pdf"),
    Pdf("ICAI Study Material", "P6A", "2",  "Types of Financing",
        CDN + "87738bos280825-ch2.pdf",
        "icai/study-material/p6a-fm/ch02.pdf"),
    Pdf("ICAI Study Material", "P6A", "3",  "Financial Analysis & Planning — Ratio Analysis",
        CDN + "87739bos280825-ch3.pdf",
        "icai/study-material/p6a-fm/ch03.pdf"),
    Pdf("ICAI Study Material", "P6A", "4",  "Cost of Capital",
        CDN + "87740bos-280825-ch4.pdf",
        "icai/study-material/p6a-fm/ch04.pdf", "~14% paper weightage"),
    Pdf("ICAI Study Material", "P6A", "5",  "Financing Decisions — Capital Structure",
        CDN + "87741bos-280825-ch5.pdf",
        "icai/study-material/p6a-fm/ch05.pdf"),
    Pdf("ICAI Study Material", "P6A", "6",  "Financing Decisions — Leverages",
        CDN + "87742bos-28082025-ch6.pdf",
        "icai/study-material/p6a-fm/ch06.pdf"),
    Pdf("ICAI Study Material", "P6A", None, "Appendix — Module 1",
        CDN + "87743bos280825-appdx.pdf",
        "icai/study-material/p6a-fm/appdx-m1.pdf"),
    Pdf("ICAI Study Material", "P6A", None, "Initial Pages — Module 2",
        CDN + "87744bos280825-ipa.pdf",
        "icai/study-material/p6a-fm/ip-m2.pdf"),
    Pdf("ICAI Study Material", "P6A", "7",  "Investment Decisions (Capital Budgeting)",
        CDN + "87745bos280825-ch7.pdf",
        "icai/study-material/p6a-fm/ch07.pdf", "~16% paper weightage"),
    Pdf("ICAI Study Material", "P6A", "8",  "Dividend Decision",
        CDN + "87746bos280825-ch8.pdf",
        "icai/study-material/p6a-fm/ch08.pdf"),
    Pdf("ICAI Study Material", "P6A", "9",  "WCM Unit I — Introduction to Working Capital Mgmt",
        CDN + "88440bos280825-cp9u1.pdf",
        "icai/study-material/p6a-fm/ch09u1.pdf"),
    Pdf("ICAI Study Material", "P6A", "10", "WCM Unit II — Treasury & Cash Management",
        CDN + "87748bos280825-cp9u2.pdf",
        "icai/study-material/p6a-fm/ch09u2.pdf"),
    Pdf("ICAI Study Material", "P6A", "11", "WCM Unit III — Management of Inventory",
        CDN + "87749bos280825-cp9u3.pdf",
        "icai/study-material/p6a-fm/ch09u3.pdf"),
    Pdf("ICAI Study Material", "P6A", "12", "WCM Unit IV — Management of Receivables",
        CDN + "87750bos280825-cp9u4.pdf",
        "icai/study-material/p6a-fm/ch09u4.pdf"),
    Pdf("ICAI Study Material", "P6A", "13", "WCM Unit V — Management of Payables (Creditors)",
        CDN + "87751bos280825-cp9u5.pdf",
        "icai/study-material/p6a-fm/ch09u5.pdf"),
    Pdf("ICAI Study Material", "P6A", "14", "WCM Unit VI — Financing of Working Capital",
        CDN + "87752bos280825-cp9u6.pdf",
        "icai/study-material/p6a-fm/ch09u6.pdf"),
    Pdf("ICAI Study Material", "P6A", None, "Appendix — Module 2",
        CDN + "87753bos280825-appdx-m2.pdf",
        "icai/study-material/p6a-fm/appdx-m2.pdf"),
]

# --------------------------------------------------------------------------
# Paper 6B — Strategic Management
# --------------------------------------------------------------------------
P6B_STUDY = [
    Pdf("ICAI Study Material", "P6B", None, "Initial Pages",
        CDN + "88000bos-aps2213-ip.pdf",
        "icai/study-material/p6b-sm/ip.pdf"),
    Pdf("ICAI Study Material", "P6B", "1", "Introduction to Strategic Management",
        CDN + "87995bos-aps2213-ch1.pdf",
        "icai/study-material/p6b-sm/ch01.pdf"),
    Pdf("ICAI Study Material", "P6B", "2", "Strategic Analysis — External Environment",
        CDN + "87996bos-aps2213-ch2.pdf",
        "icai/study-material/p6b-sm/ch02.pdf"),
    Pdf("ICAI Study Material", "P6B", "3", "Strategic Analysis — Internal Environment",
        CDN + "87997bos-aps2213-ch3.pdf",
        "icai/study-material/p6b-sm/ch03.pdf"),
    Pdf("ICAI Study Material", "P6B", "4", "Strategic Choices",
        CDN + "87998bos-aps2213-ch4.pdf",
        "icai/study-material/p6b-sm/ch04.pdf", "~22% paper weightage"),
    Pdf("ICAI Study Material", "P6B", "5", "Strategy Implementation & Evaluation",
        CDN + "87999bos-aps2213-ch5.pdf",
        "icai/study-material/p6b-sm/ch05.pdf"),
]

# --------------------------------------------------------------------------
# RTPs — Revision Test Papers (Group II, recent attempts)
# Paper 6 covers FM + SM combined.
# --------------------------------------------------------------------------
RTPS = [
    # May 2025
    Pdf("RTP", "P4", None, "RTP · May 2025 · Costing",
        CDN + "84740bos68254-p4.pdf", "icai/rtp/p4-may2025.pdf"),
    Pdf("RTP", "P5", None, "RTP · May 2025 · Audit & Ethics",
        CDN + "84741bos68254ch5.pdf", "icai/rtp/p5-may2025.pdf"),
    Pdf("RTP", "P6", None, "RTP · May 2025 · FM & SM",
        CDN + "84742bos68254ch6.pdf", "icai/rtp/p6-may2025.pdf"),
    # Sep 2025
    Pdf("RTP", "P4", None, "RTP · Sep 2025 · Costing",
        CDN + "86540rtp-int-g2-sep2025-4.pdf", "icai/rtp/p4-sep2025.pdf"),
    Pdf("RTP", "P5", None, "RTP · Sep 2025 · Audit & Ethics",
        CDN + "86541rtp-int-g2-sep2025-5.pdf", "icai/rtp/p5-sep2025.pdf"),
    Pdf("RTP", "P6", None, "RTP · Sep 2025 · FM & SM",
        CDN + "86542rtp-int-g2-sep2025-6.pdf", "icai/rtp/p6-sep2025.pdf"),
    # Jan 2026
    Pdf("RTP", "P4", None, "RTP · Jan 2026 · Costing",
        CDN + "88956bos-aps2810-p4.pdf", "icai/rtp/p4-jan2026.pdf"),
    Pdf("RTP", "P5", None, "RTP · Jan 2026 · Audit & Ethics",
        CDN + "88957bos-aps2810-p5.pdf", "icai/rtp/p5-jan2026.pdf"),
    Pdf("RTP", "P6", None, "RTP · Jan 2026 · FM & SM",
        CDN + "88958bos-aps2810-p6.pdf", "icai/rtp/p6-jan2026.pdf"),
    # May 2026 (most recent)
    Pdf("RTP", "P4", None, "RTP · May 2026 · Costing",
        CDN + "91025bos-aps4256-int-may2026-p4.pdf", "icai/rtp/p4-may2026.pdf", "Latest"),
    Pdf("RTP", "P5", None, "RTP · May 2026 · Audit & Ethics",
        CDN + "91021bos-aps4256-int-may2026-p5.pdf", "icai/rtp/p5-may2026.pdf", "Latest"),
    Pdf("RTP", "P6", None, "RTP · May 2026 · FM & SM",
        CDN + "91022bos-aps4256-int-may2026-p6.pdf", "icai/rtp/p6-may2026.pdf", "Latest"),
]

# --------------------------------------------------------------------------
# Question Papers + Suggested Answers (NSET-era attempts only)
# Paper 6 covers FM + SM combined.
# --------------------------------------------------------------------------
QPS = [
    # May 2024
    Pdf("QP", "P4", None, "QP & Suggested · May 2024 · Costing",
        CDN + "80257bos64413.pdf", "icai/qp/p4-may2024.pdf"),
    Pdf("QP", "P5", None, "QP & Suggested · May 2024 · Audit & Ethics",
        CDN + "80289bos64445.pdf", "icai/qp/p5-may2024.pdf"),
    Pdf("QP", "P6", None, "QP & Suggested · May 2024 · FM & SM",
        CDN + "80550bos64734.pdf", "icai/qp/p6-may2024.pdf"),
    # Sep 2024
    Pdf("QP", "P4", None, "QP & Suggested · Sep 2024 · Costing",
        CDN + "82219bos66270.pdf", "icai/qp/p4-sep2024.pdf"),
    Pdf("QP", "P5", None, "QP & Suggested · Sep 2024 · Audit & Ethics",
        CDN + "82232bos66294.pdf", "icai/qp/p5-sep2024.pdf"),
    Pdf("QP", "P6", None, "QP & Suggested · Sep 2024 · FM & SM",
        CDN + "82246bos66313.pdf", "icai/qp/p6-sep2024.pdf"),
    # Jan 2025
    Pdf("QP", "P4", None, "QP & Suggested · Jan 2025 · Costing",
        CDN + "84222bos67894-p4.pdf", "icai/qp/p4-jan2025.pdf"),
    Pdf("QP", "P5", None, "QP & Suggested · Jan 2025 · Audit & Ethics",
        CDN + "84223bos67894-p5.pdf", "icai/qp/p5-jan2025.pdf"),
    Pdf("QP", "P6", None, "QP & Suggested · Jan 2025 · FM & SM",
        CDN + "84224bos67894-p6.pdf", "icai/qp/p6-jan2025.pdf"),
    # May 2025
    Pdf("QP", "P4", None, "QP & Suggested · May 2025 · Costing",
        CDN + "86049bos-aps471-int-p4.pdf", "icai/qp/p4-may2025.pdf"),
    Pdf("QP", "P5", None, "QP & Suggested · May 2025 · Audit & Ethics",
        CDN + "86050bos-aps471-int-p5.pdf", "icai/qp/p5-may2025.pdf"),
    Pdf("QP", "P6", None, "QP & Suggested · May 2025 · FM & SM",
        CDN + "86051bos-aps471-int-p6.pdf", "icai/qp/p6-may2025.pdf"),
    # Sep 2025
    Pdf("QP", "P4", None, "QP & Suggested · Sep 2025 · Costing",
        CDN + "88318bos-aps2271-int-p4-sep2025.pdf", "icai/qp/p4-sep2025.pdf"),
    Pdf("QP", "P5", None, "QP & Suggested · Sep 2025 · Audit & Ethics",
        CDN + "88273bos-aps2271-int-p5-sep2025.pdf", "icai/qp/p5-sep2025.pdf"),
    Pdf("QP", "P6", None, "QP & Suggested · Sep 2025 · FM & SM",
        CDN + "88294bos160925.pdf", "icai/qp/p6-sep2025.pdf"),
    # Jan 2026
    Pdf("QP", "P4", None, "QP & Suggested · Jan 2026 · Costing",
        CDN + "90301bos-aps3856-int-jan2026-p4.pdf", "icai/qp/p4-jan2026.pdf"),
    Pdf("QP", "P5", None, "QP & Suggested · Jan 2026 · Audit & Ethics",
        CDN + "90667bos-aps3856-int-jan2026-p5.pdf", "icai/qp/p5-jan2026.pdf"),
    Pdf("QP", "P6", None, "QP & Suggested · Jan 2026 · FM & SM",
        CDN + "90369bos-aps3856-int-jan2026-p6.pdf", "icai/qp/p6-jan2026.pdf"),
    # May 2026 (latest)
    Pdf("QP", "P4", None, "QP & Suggested · May 2026 · Costing",
        CDN + "92190bos-aps4903-int-may2026-p4.pdf", "icai/qp/p4-may2026.pdf", "Most recent"),
    Pdf("QP", "P5", None, "QP & Suggested · May 2026 · Audit & Ethics",
        CDN + "92223bos-aps4903-int-may2026-p5.pdf", "icai/qp/p5-may2026.pdf", "Most recent"),
    Pdf("QP", "P6", None, "QP & Suggested · May 2026 · FM & SM",
        CDN + "92261bos-aps4903-int-may2026-p6.pdf", "icai/qp/p6-may2026.pdf", "Most recent"),
]


ALL: list[Pdf] = P4_STUDY + P5_STUDY + P6A_STUDY + P6B_STUDY + RTPS + QPS


def by_category() -> dict[str, list[Pdf]]:
    """Group all entries by category, preserving insertion order."""
    groups: dict[str, list[Pdf]] = {}
    for p in ALL:
        groups.setdefault(p.category, []).append(p)
    return groups


if __name__ == "__main__":
    # Sanity: print a tally
    print(f"Total entries: {len(ALL)}")
    for cat, items in by_category().items():
        print(f"  {cat:25s} {len(items):3d}")
    # Detect duplicate local paths (bug guard)
    seen: set[str] = set()
    dupes: list[str] = []
    for p in ALL:
        if p.local_path in seen:
            dupes.append(p.local_path)
        seen.add(p.local_path)
    if dupes:
        print("DUPLICATE local_path entries:", dupes)
    else:
        print("All local_path values unique ✓")
