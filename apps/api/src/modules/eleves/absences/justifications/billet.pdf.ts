import { pdfGenerator } from "../../../../lib/pdfGenerator.js";
import { templateEngine } from "../../../../lib/templateEngine.js";
import { JustificationService } from "./justification.service.js";

type UserContext = { id: string; role: string; schoolId: string | null };

// Le format (148x105 mm) est définie par le @page du template
export async function genererBilletPdf(
  billetId: string,
  user: UserContext,
): Promise<Buffer> {
  const billet = await JustificationService.getBilletPourImpression(
    billetId,
    user,
  ); // Récupère le billet pour impression en s'assurant que l'utilisateur a le droit d'y accéder
  const html = await templateEngine.compile("billet", {
    billet,
    dateImpression: new Date(),
  }); // Compile le template "billet" avec les données du billet et la date d'impression

  return pdfGenerator.htmlToPdf(html, {
    format: "A5",
    orientation: "landscape",
  }); // Génère le PDF à partir du HTML compilé et retourne le buffer
}
