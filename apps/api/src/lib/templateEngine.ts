import Handlebars from "handlebars";
import fs from "fs/promises";
import path from "path";

type TemplateDelegate = HandlebarsTemplateDelegate;

// ============================================================================
// HANDLEBARS TEMPLATE ENGINE
// ============================================================================

export class TemplateEngine {
  private cache = new Map<string, TemplateDelegate>();
  private readonly templatesDir: string;

  constructor(templatesDir?: string) {
    // Templates are co-located with the compiled code
    this.templatesDir = templatesDir ?? path.join(__dirname, "..", "templates");
    this.registerHelpers();
  }

  private registerHelpers(): void {
    // ----- Date formatters -----
    Handlebars.registerHelper("formatDate", (date: string | Date) => {
      if (!date) return "";
      const d = typeof date === "string" ? new Date(date) : date;
      if (Number.isNaN(d.getTime())) return "";
      return d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    });

    Handlebars.registerHelper("formatDateLong", (date: string | Date) => {
      if (!date) return "";
      const d = typeof date === "string" ? new Date(date) : date;
      if (Number.isNaN(d.getTime())) return "";
      return d.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    });

    // ----- String helpers -----
    Handlebars.registerHelper("uppercase", (str: string) =>
      str ? str.toUpperCase() : "",
    );
    Handlebars.registerHelper("lowercase", (str: string) =>
      str ? str.toLowerCase() : "",
    );

    // ----- Comparison helpers -----
    Handlebars.registerHelper("eq", (a, b) => a === b);
    Handlebars.registerHelper("ne", (a, b) => a !== b);
    Handlebars.registerHelper("gt", (a, b) => a > b);
    Handlebars.registerHelper("gte", (a, b) => a >= b);
    Handlebars.registerHelper("lt", (a, b) => a < b);
    Handlebars.registerHelper("lte", (a, b) => a <= b);

    // ----- Domain helpers -----
    Handlebars.registerHelper("grade", (avg: number) => {
      if (avg >= 16) return "Très bien";
      if (avg >= 14) return "Bien";
      if (avg >= 12) return "Assez bien";
      if (avg >= 10) return "Passable";
      return "Insuffisant";
    });

    Handlebars.registerHelper("mentionLabel", (m: string) => {
      const map: Record<string, string> = {
        AUCUNE: "",
        ENCOURAGEMENT: "Encouragements",
        TABLEAU_HONNEUR: "Tableau d'honneur",
        FELICITATIONS: "Félicitations",
      };
      return map[m] ?? m;
    });

    Handlebars.registerHelper("decisionLabel", (decision: string) => {
      const map: Record<string, string> = {
        PASSE: "Admis(e) en classe supérieure",
        REDOUBLE: "Redoublement",
        ORIENTE: "Orienté(e)",
        EXCLU: "Exclu(e)",
      };
      return map[decision] ?? decision;
    });

    Handlebars.registerHelper("avertissementLabel", (a: string) => {
      const map: Record<string, string> = {
        AUCUN: "",
        TRAVAIL: "Avertissement travail",
        CONDUITE: "Avertissement conduite",
        RETARDS: "Avertissement retards",
        DISCIPLINE: "Avertissement discipline",
        GENERAL: "Avertissement général",
      };
      return map[a] ?? a;
    });
  }

  async compile<T extends Record<string, unknown>>(
    templateName: string,
    data: T,
  ): Promise<string> {
    const cacheKey = templateName;
    let template = this.cache.get(cacheKey);

    if (!template) {
      const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
      const source = await fs.readFile(templatePath, "utf-8");
      template = Handlebars.compile(source);
      this.cache.set(cacheKey, template);
    }

    return template(data);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const templateEngine = new TemplateEngine();
