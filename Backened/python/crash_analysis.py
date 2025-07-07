import os
import re
import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import matplotlib
import warnings
from pptx import Presentation
from pptx.util import Inches

# === Configs ===
matplotlib.rcParams["font.family"] = "Segoe UI Emoji"
warnings.filterwarnings("ignore", message=".*Tight layout not applied.*")
sns.set(style="whitegrid")

def run_crash_analysis(input_csv, output_dir):
    def ensure_dirs(base):
        img_dir = os.path.join(base, "crash_images")
        os.makedirs(img_dir, exist_ok=True)
        for f in os.listdir(img_dir):
            if f.endswith(".jpg") or f.endswith(".png"):
                os.remove(os.path.join(img_dir, f))
        return img_dir

    def cleanup_df(df):
        df.columns = df.columns.str.strip()
        if "Event Time" in df:
            df["Event Time"] = pd.to_datetime(df["Event Time"], errors="coerce")
        return df.ffill().infer_objects(copy=False)

    def extract(pattern, text, group=1):
        match = re.search(pattern, str(text))
        return match.group(group) if match else None

    def parse_structured_crash_logs(df):
        col = "App Crash Process Info"
        rows = []
        for log in df[col].dropna().astype(str):
            rows.append({
                "Timestamp": extract(r"Timestamp: (.*?) pid", log),
                "App": extract(r">>> (.*?) <<<", log),
                "ABI": extract(r"ABI: '(.*?)'", log),
                "Process": extract(r"name: (.*?)\s+>>>", log),
                "Signal Name": extract(r"signal \d+ \((.*?)\)", log),
                "Signal Code": int(extract(r"signal (\d+)", log) or -1),
                "Error Name": extract(r"code -?\d+ \((.*?)\)", log),
                "Error Code": int(extract(r"code (-?\d+)", log) or -1),
                "Build": extract(r"Build fingerprint: '(.*?)'", log),
                "Libraries (Backtrace)": " → ".join(re.findall(r"#\d+\s+pc .*?\s+(.*?)\s", log)[:3]) or "N/A"
            })
        return pd.DataFrame(rows)

    def save_chart(fig, name, img_dir):
        path = os.path.join(img_dir, f"{name}.png")
        fig.savefig(path, dpi=300, bbox_inches="tight")
        plt.close(fig)
        return path

    def bar_chart(series, title, xlabel, name, img_dir, horizontal=False):
        fig, ax = plt.subplots(figsize=(12, 6))
        if horizontal:
            series.plot(kind="barh", ax=ax, color="skyblue", edgecolor="black")
            ax.invert_yaxis()
        else:
            series.plot(kind="bar", ax=ax, color="steelblue", edgecolor="black")
            ax.set_xticklabels(ax.get_xticklabels(), rotation=45)

        ax.set_title(title)
        ax.set_xlabel(xlabel)
        ax.set_ylabel("Count")
        for p in ax.patches:
            val = p.get_width() if horizontal else p.get_height()
            ax.annotate(str(int(val)), (p.get_x() + p.get_width() / 2, val + 1),
                        ha='center', fontsize=9)
        fig.tight_layout()
        return save_chart(fig, name, img_dir)

    def build_ppt(img_dir, outdir):
        ppt_path = os.path.join(outdir, "crash_report.pptx")
        if os.path.exists(ppt_path): os.remove(ppt_path)

        prs = Presentation()
        blank = prs.slide_layouts[6]

        for img in sorted(os.listdir(img_dir)):
            if img.endswith(".png"):
                slide = prs.slides.add_slide(blank)
                slide.shapes.add_picture(os.path.join(img_dir, img), 0, 0,
                                         width=prs.slide_width, height=prs.slide_height)
        prs.save(ppt_path)

    # === Load and Prepare Data ===
    df = pd.read_csv(input_csv)
    df = cleanup_df(df)
    img_dir = ensure_dirs(output_dir)
    summary_path = os.path.join(output_dir, "crash_summary.json")
    if os.path.exists(summary_path): os.remove(summary_path)
    summary = {}


    # # === Parse Crash Process Logs ===
    # parsed = parse_structured_crash_logs(df)

    # if not parsed.empty:
    #     if "Signal Name" in parsed:
    #         vc = parsed["Signal Name"].value_counts()
    #         bar_chart(vc, "Crash Frequency by Signal", "Signal", "signal_freq", img_dir)
    #         summary["Crash Frequency by Signal"] = vc.to_dict()

    #     if "Error Name" in parsed:
    #         vc = parsed["Error Name"].value_counts()
    #         bar_chart(vc, "Top Error Types", "Error", "error_types", img_dir)
    #         summary["Top Error Types"] = vc.to_dict()

    #     if "Libraries (Backtrace)" in parsed:
    #         vc = parsed["Libraries (Backtrace)"].value_counts().head(10)
    #         bar_chart(vc, "Top Backtrace Chains", "Backtrace", "top_backtrace_chain", img_dir, horizontal=True)
    #         summary["Top Backtrace Chains"] = vc.to_dict()

    #     parsed["Timestamp"] = pd.to_datetime(parsed["Timestamp"], errors="coerce", utc=True)
    #     parsed.to_csv(os.path.join(output_dir, "parsed_crash_info.csv"), index=False)

    # === Additional Visuals ===
    if "Di 8" in df.columns:
        vc = df["Di 8"].value_counts().nlargest(10)
        bar_chart(vc, "Top 10 STB Serial Numbers", "STB Serial No", "STB_Serial_NO", img_dir)
        summary["Top STB Serial Numbers"] = vc.to_dict()

    if "STB model" in df.columns:
        vc = df["STB model"].value_counts().nlargest(10)
        bar_chart(vc, "Top 10 STB Models", "STB model", "STB_Model", img_dir)
        summary["Top STB Models"] = vc.to_dict()

    # === Libraries involved ===
    def parse_libs(log):
        match = re.search(r'/lib/.*/(lib\w+\.so)', str(log))
        return match.group(1) if match else None

    libs = df["App Crash Process Info"].dropna().apply(parse_libs).dropna()
    if not libs.empty:
        vc = libs.value_counts().nlargest(10)
        fig, ax = plt.subplots(figsize=(10, 5))
        sns.countplot(y=libs, order=vc.index, ax=ax, palette="crest")
        ax.set_title("Top Faulting Libraries")
        ax.set_xlabel("Crash Count")
        ax.set_ylabel("Library")
        fig.tight_layout()
        save_chart(fig, "faulting_libraries", img_dir)
        summary["Faulting Libraries"] = vc.to_dict()
        # === Crashes by State ===
    if "State" in df.columns:
        vc = df["State"].value_counts()
        bar_chart(vc, "Crashes by State", "State", "by_state", img_dir)
        summary["Crashes by State"] = vc.to_dict()


    # === Save JSON + PPT ===
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    build_ppt(img_dir, output_dir)


# === CLI Support ===
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--outdir', required=True)
    args = parser.parse_args()
    run_crash_analysis(args.input, args.outdir)
