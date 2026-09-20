import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useEcolagesEleve,
  useEnregistrerPaiement,
} from "../hooks/usePaiementEcolage";
import { ConfirmPaiementModal } from "./ConfirmPaiementModal";
import type { EnregistrerPaiementInput } from "../hooks/usePaiementEcolage";

const saisiePaiementSchema = z
  .object({
    typeFrais: z.enum(["ECOLAGE", "DROIT_INSCRIPTION", "FRAIS_EXAMEN"]),
    mois: z.coerce.number().int().min(1).max(12).nullish(),
    montantSaisi: z.coerce.number().positive("Le montant doit être positif"),
    modePaiement: z.enum(["ESPECES", "VIREMENT", "CHEQUE", "MOBILE_MONEY"]),
    referencePaiement: z.string().trim().max(100).optional().or(z.literal("")),
    remarque: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .refine((data) => data.typeFrais !== "ECOLAGE" || data.mois != null, {
    message: "Sélectionnez le mois concerné",
    path: ["mois"],
  })
  .refine(
    (data) => data.modePaiement === "ESPECES" || !!data.referencePaiement,
    {
      message: "La référence est requise pour ce mode de paiement",
      path: ["referencePaiement"],
    },
  );

type SaisiePaiementFormInput = z.input<typeof saisiePaiementSchema>;
type SaisiePaiementFormValues = z.output<typeof saisiePaiementSchema>;

type SaisiePaiementFormProps = {
  eleveId: string;
};

/** Formulaire sécurisé de saisie d'un paiement d'écolage par un agent. */
export function SaisiePaiementForm({ eleveId }: SaisiePaiementFormProps) {
  const [pendingValues, setPendingValues] =
    useState<SaisiePaiementFormValues | null>(null);

  const { data: ecolages = [] } = useEcolagesEleve(eleveId);
  const mutation = useEnregistrerPaiement(eleveId);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<SaisiePaiementFormInput, undefined, SaisiePaiementFormValues>({
    resolver: zodResolver(saisiePaiementSchema),
    defaultValues: {
      typeFrais: "ECOLAGE",
      modePaiement: "ESPECES",
      referencePaiement: "",
      remarque: "",
    },
  });

  const typeFrais = useWatch({ control, name: "typeFrais" });
  const mois = useWatch({ control, name: "mois" }) as number | null | undefined;
  const modePaiement = useWatch({ control, name: "modePaiement" });

  // Pré-remplit le montant avec celui dû pour le mois sélectionné
  const handleMoisChange = (value: number) => {
    setValue("mois", value);
    const ligne = ecolages.find((e) => e.mois === value);
    if (ligne) {
      const resteDu = Number(ligne.montant) - Number(ligne.montantPaye);
      setValue("montantSaisi", resteDu > 0 ? resteDu : Number(ligne.montant));
    }
  };

  const onSubmit = (values: SaisiePaiementFormValues) => {
    setPendingValues(values);
  };

  const handleConfirm = async () => {
    if (!pendingValues) return;

    const anneeScolaire =
      ecolages.find((e) => e.mois === pendingValues.mois)?.anneeScolaire ??
      ecolages[0]?.anneeScolaire ??
      "";

    const payload: EnregistrerPaiementInput = {
      anneeScolaire,
      typeFrais: pendingValues.typeFrais,
      mois: pendingValues.mois ?? null,
      montantSaisi: pendingValues.montantSaisi,
      modePaiement: pendingValues.modePaiement,
      referencePaiement: pendingValues.referencePaiement || null,
      remarque: pendingValues.remarque || null,
    };

    try {
      await mutation.mutateAsync(payload);
      setPendingValues(null);
      reset();
    } catch {
      // L'erreur est déjà notifiée par le hook
    }
  };

  return (
    <div className="card border border-base-200 bg-base-100 shadow-sm">
      <div className="card-body">
        <h2 className="card-title text-base">Encaisser un paiement</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <fieldset className="fieldset">
              <label className="label" htmlFor="typeFrais">
                <span className="label-text">Type de frais</span>
              </label>
              <select
                id="typeFrais"
                className="select select-bordered w-full"
                {...register("typeFrais")}
              >
                <option value="ECOLAGE">Écolage mensuel</option>
                <option value="DROIT_INSCRIPTION">Droit d'inscription</option>
                <option value="FRAIS_EXAMEN">Frais d'examen</option>
              </select>
            </fieldset>

            {typeFrais === "ECOLAGE" && (
              <fieldset className="fieldset">
                <label className="label" htmlFor="mois">
                  <span className="label-text">Mois concerné</span>
                </label>
                <select
                  id="mois"
                  className="select select-bordered w-full"
                  value={mois ?? ""}
                  onChange={(e) => handleMoisChange(Number(e.target.value))}
                >
                  <option value="" disabled>
                    Sélectionner un mois
                  </option>
                  {ecolages.map((e) => (
                    <option key={e.id} value={e.mois}>
                      Mois {e.mois} — {e.statutPaiement}
                    </option>
                  ))}
                </select>
                {errors.mois && (
                  <span className="text-error text-sm">
                    {errors.mois.message}
                  </span>
                )}
              </fieldset>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <fieldset className="fieldset">
              <label className="label" htmlFor="montantSaisi">
                <span className="label-text">Montant payé</span>
              </label>
              <input
                id="montantSaisi"
                type="number"
                step="0.01"
                className="input input-bordered w-full"
                {...register("montantSaisi")}
              />
              {errors.montantSaisi && (
                <span className="text-error text-sm">
                  {errors.montantSaisi.message}
                </span>
              )}
            </fieldset>

            <fieldset className="fieldset">
              <label className="label" htmlFor="modePaiement">
                <span className="label-text">Mode de paiement</span>
              </label>
              <select
                id="modePaiement"
                className="select select-bordered w-full"
                {...register("modePaiement")}
              >
                <option value="ESPECES">Espèces</option>
                <option value="CHEQUE">Chèque</option>
                <option value="VIREMENT">Virement</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
              </select>
            </fieldset>
          </div>

          {modePaiement !== "ESPECES" && (
            <fieldset className="fieldset">
              <label className="label" htmlFor="referencePaiement">
                <span className="label-text">Référence / N° de pièce</span>
              </label>
              <input
                id="referencePaiement"
                type="text"
                className="input input-bordered w-full"
                {...register("referencePaiement")}
              />
              {errors.referencePaiement && (
                <span className="text-error text-sm">
                  {errors.referencePaiement.message}
                </span>
              )}
            </fieldset>
          )}

          <fieldset className="fieldset">
            <label className="label" htmlFor="remarque">
              <span className="label-text">Remarque (facultatif)</span>
            </label>
            <textarea
              id="remarque"
              className="textarea textarea-bordered w-full"
              rows={2}
              {...register("remarque")}
            />
          </fieldset>

          <button type="submit" className="btn btn-primary w-full sm:w-auto">
            Encaisser le paiement
          </button>
        </form>
      </div>

      <ConfirmPaiementModal
        isOpen={!!pendingValues}
        values={pendingValues}
        isPending={mutation.isPending}
        onConfirm={handleConfirm}
        onClose={() => setPendingValues(null)}
      />
    </div>
  );
}
