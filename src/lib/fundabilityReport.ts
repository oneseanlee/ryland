import { jsPDF } from "jspdf";
import { BENCHMARKS, TRACK_LABEL, TRACK_MESSAGE, benchmarkById, DISCLOSURE, type Answer, type ScoreResult } from "@/lib/fundability";
import logo from "@/assets/logo-dark.png";

const NAVY: [number, number, number] = [0, 58, 112];
const BLUE: [number, number, number] = [0, 96, 169];
const GREEN: [number, number, number] = [35, 132, 103];
const RED: [number, number, number] = [192, 77, 72];
const AMBER: [number, number, number] = [176, 125, 20];

async function loadImage(src: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext("2d")!.drawImage(img, 0, 0);
    return { data: c.toDataURL("image/png"), w: img.naturalWidth, h: img.naturalHeight };
  } catch { return null; }
}

export async function downloadScorecard(firstName: string, answers: Record<string, Answer>, r: ScoreResult) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = M;

  const ensure = (need: number) => { if (y + need > H - 70) { doc.addPage(); y = M; } };
  const text = (s: string, size: number, opts: { bold?: boolean; color?: [number, number, number]; x?: number; width?: number } = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...(opts.color ?? [30, 30, 30]));
    const lines = doc.splitTextToSize(s, opts.width ?? W - M * 2);
    ensure(lines.length * size * 1.3);
    doc.text(lines, opts.x ?? M, y + size);
    y += lines.length * size * 1.3;
  };

  const img = await loadImage(logo);
  if (img) { const h = 28; doc.addImage(img.data, "PNG", M, y, (img.w / img.h) * h, h); }
  y += 44;
  text("YOUR FUNDABILITY SCORECARD", 10, { bold: true, color: BLUE });
  text(`Prepared for ${firstName} · ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 11, { color: [90, 90, 90] });
  y += 10;

  doc.setFillColor(...NAVY); doc.roundedRect(M, y, W - M * 2, 92, 8, 8, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(40);
  doc.text(`${r.total} / 12`, M + 20, y + 52);
  doc.setFontSize(14); doc.text(TRACK_LABEL[r.track], M + 190, y + 34);
  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  doc.text(`Personal credit ${r.personal}/6   ·   Business structure ${r.business}/6`, M + 190, y + 54);
  if (r.provisional) doc.text("Provisional: some benchmarks are not yet verified.", M + 190, y + 72);
  y += 110;
  text(TRACK_MESSAGE[r.track], 11);
  y += 12;

  text("YOUR 12-BENCHMARK BOARD", 10, { bold: true, color: BLUE });
  y += 4;
  for (const b of BENCHMARKS) {
    const a = answers[b.id];
    const [label, color] = a === "yes" ? ["PASS", GREEN] : a === "no" ? ["NEEDS ATTENTION", RED] : ["NOT VERIFIED", AMBER];
    ensure(40);
    doc.setFillColor(...(color as [number, number, number])); doc.circle(M + 5, y + 8, 4, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(30, 30, 30);
    doc.text(`${b.id}  ${b.title}`, M + 16, y + 12);
    doc.setTextColor(...(color as [number, number, number])); doc.text(label as string, W - M, y + 12, { align: "right" });
    y += 18;
    text(`Target: ${b.target}`, 9, { color: [90, 90, 90], x: M + 16, width: W - M * 2 - 16 });
    y += 6;
  }

  y += 8;
  text("YOUR TOP PRIORITIES", 10, { bold: true, color: BLUE });
  if (r.priorities.length === 0) {
    text("All 12 self-reported benchmarks pass. Next steps: verify your actual three-bureau and business files, review lender-specific requirements, and plan your application sequence.", 11);
  } else {
    r.priorities.forEach((id, i) => {
      const b = benchmarkById(id);
      text(`${i + 1}. ${b.title}${answers[id] === "unsure" ? " (verify)" : ""}`, 11, { bold: true });
      text(b.fix, 10, { x: M + 14, width: W - M * 2 - 14 });
      y += 4;
    });
  }

  y += 10;
  text("YOUR NEXT STEP: A FREE FUNDING REVIEW", 10, { bold: true, color: BLUE });
  text("A funding manager reviews your actual file with you: which benchmarks are met, which need attention, and what should happen before your next application. Book at rylandpartners.com/consultation. A separate three-bureau report (MyFreeScoreNow, $1 introductory soft pull) may be needed for the detailed review; it is not part of this free assessment.", 10);
  y += 12;
  text(DISCLOSURE, 8, { color: [110, 110, 110] });
  text("Self-reported educational assessment. Not a credit report, credit pull, or lending decision. © Ryland Partners · rylandpartners.com", 8, { color: [110, 110, 110] });

  doc.save(`Fundability_Scorecard_${firstName.replace(/[^a-z0-9]/gi, "_")}.pdf`);
}
