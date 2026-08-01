'use client';

import {
  type FormEvent,
  useMemo,
  useState,
} from 'react';

import {
  createProjectApplicationDraft,
  submitProjectApplication,
} from '../../services/projects/projectApplicationService';

import type {
  CloudProjectSummary,
} from '../../services/projects/projectCloudService';

import type {
  WorkspaceActor,
} from '../../types/workspace';

import type {
  CampaignApplicationDetails,
  ExperienceApplicationDetails,
  ProductApplicationDetails,
  ProjectApplicationInput,
  ProjectApplicationRoute,
  ProjectApplicationType,
} from '../../types/projectApplication';

interface ProjectApplicationDialogProps {
  project: CloudProjectSummary;
  actors: WorkspaceActor[];
  activeActorId: string | null;
  onClose: () => void;
  onSubmitted: () => void;
}

const applicationTypeOptions: Array<{
  value: ProjectApplicationType;
  label: string;
  description: string;
}> = [
  {
    value: 'creative_project',
    label: 'Proyecto creativo',
    description:
      'Busca conexiones, aliados, producción o una ruta dentro del ecosistema.',
  },
  {
    value: 'product',
    label: 'Producto',
    description:
      'Propone un producto para distribución, integración en tickets o activaciones.',
  },
  {
    value: 'experience',
    label: 'Experiencia',
    description:
      'Propone un taller, clase, evento, exposición, concierto u otra experiencia.',
  },
  {
    value: 'campaign',
    label: 'Campaña',
    description:
      'Busca producir una campaña con artistas, espacios, productores o medios.',
  },
  {
    value: 'activation',
    label: 'Activación',
    description:
      'Busca ejecutar una activación de marca dentro del ecosistema.',
  },
  {
    value: 'call',
    label: 'Convocatoria',
    description:
      'Busca publicar o activar una convocatoria para actores del ecosistema.',
  },
  {
    value: 'editorial_story',
    label: 'Historia editorial',
    description:
      'Propone un proceso o historia para consideración del medio.',
  },
  {
    value: 'other',
    label: 'Otro',
    description:
      'Una aplicación que no encaja en las rutas anteriores.',
  },
];

const routeOptions: Array<{
  value: ProjectApplicationRoute;
  label: string;
}> = [
  {
    value: 'ecosystem_connections',
    label: 'Conexiones con actores',
  },
  {
    value: 'cultural_calendar',
    label: 'Agenda cultural',
  },
  {
    value: 'ticket_distribution',
    label: 'Distribución dentro de tickets',
  },
  {
    value: 'brand_activation',
    label: 'Activación de marca',
  },
  {
    value: 'space_match',
    label: 'Conexión con espacios',
  },
  {
    value: 'funding_opportunity',
    label: 'Oportunidad de financiación',
  },
  {
    value: 'editorial_consideration',
    label: 'Consideración editorial',
  },
  {
    value: 'other',
    label: 'Otra ruta',
  },
];

export function ProjectApplicationDialog({
  project,
  actors,
  activeActorId,
  onClose,
  onSubmitted,
}: ProjectApplicationDialogProps) {
  const [
    actorId,
    setActorId,
  ] = useState(
    activeActorId ??
      actors[0]?.id ??
      ''
  );

  const [
    applicationType,
    setApplicationType,
  ] = useState<ProjectApplicationType>(
    'creative_project'
  );

  const [
    requestedRoutes,
    setRequestedRoutes,
  ] = useState<ProjectApplicationRoute[]>(
    ['ecosystem_connections']
  );

  const [
    publicSummary,
    setPublicSummary,
  ] = useState(
    project.description
  );

  const [
    ecosystemOffer,
    setEcosystemOffer,
  ] = useState('');

  const [
    ecosystemNeeds,
    setEcosystemNeeds,
  ] = useState('');

  const [
    targetAudience,
    setTargetAudience,
  ] = useState('');

  const [
    geographicScope,
    setGeographicScope,
  ] = useState('');

  const [
    productName,
    setProductName,
  ] = useState(project.title);

  const [
    productDescription,
    setProductDescription,
  ] = useState(project.description);

  const [
    wholesalePrice,
    setWholesalePrice,
  ] = useState('');

  const [
    proposedTicketPrice,
    setProposedTicketPrice,
  ] = useState('');

  const [
    availableUnits,
    setAvailableUnits,
  ] = useState('');

  const [
    minimumOrderUnits,
    setMinimumOrderUnits,
  ] = useState('');

  const [
    productionCapacity,
    setProductionCapacity,
  ] = useState('');

  const [
    deliveryConditions,
    setDeliveryConditions,
  ] = useState('');

  const [
    legalRestrictions,
    setLegalRestrictions,
  ] = useState('');

  const [
    storageRequirements,
    setStorageRequirements,
  ] = useState('');

  const [
    compatibleExperiences,
    setCompatibleExperiences,
  ] = useState('');

  const [
    expectedParticipants,
    setExpectedParticipants,
  ] = useState('');

  const [
    estimatedTicketPrice,
    setEstimatedTicketPrice,
  ] = useState('');

  const [
    preferredCities,
    setPreferredCities,
  ] = useState('');

  const [
    spaceRequirements,
    setSpaceRequirements,
  ] = useState('');

  const [
    technicalRequirements,
    setTechnicalRequirements,
  ] = useState('');

  const [
    proposedDates,
    setProposedDates,
  ] = useState('');

  const [
    campaignObjective,
    setCampaignObjective,
  ] = useState('');

  const [
    campaignTargetAudience,
    setCampaignTargetAudience,
  ] = useState('');

  const [
    estimatedReach,
    setEstimatedReach,
  ] = useState('');

  const [
    availableBudget,
    setAvailableBudget,
  ] = useState('');

  const [
    requiredProfiles,
    setRequiredProfiles,
  ] = useState('');

  const [
    requiredSpaces,
    setRequiredSpaces,
  ] = useState('');

  const [
    expectedDeliverables,
    setExpectedDeliverables,
  ] = useState('');

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const selectedActor =
    useMemo(
      () =>
        actors.find(
          (actor) =>
            actor.id === actorId
        ) ?? null,
      [
        actorId,
        actors,
      ]
    );

  const productMargin =
    toNullableNumber(
      proposedTicketPrice
    ) !== null &&
    toNullableNumber(
      wholesalePrice
    ) !== null
      ? Math.max(
          (
            toNullableNumber(
              proposedTicketPrice
            ) ?? 0
          ) -
            (
              toNullableNumber(
                wholesalePrice
              ) ?? 0
            ),
          0
        )
      : null;

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedActor) {
      setErrorMessage(
        'Selecciona una identidad válida.'
      );

      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const input:
        ProjectApplicationInput = {
        projectId:
          project.id,

        actorId:
          getRawActorId(
            selectedActor.id
          ),

        actorType:
          selectedActor.type,

        applicationType,

        requestedRoutes,

        publicSummary,

        ecosystemOffer,

        ecosystemNeeds,

        targetAudience,

        geographicScope,

        snapshot:
          createTemporarySnapshot(
            project
          ),

        productDetails:
          applicationType ===
          'product'
            ? buildProductDetails()
            : undefined,

        experienceDetails:
          applicationType ===
          'experience'
            ? buildExperienceDetails()
            : undefined,

        campaignDetails:
          applicationType ===
            'campaign' ||
          applicationType ===
            'activation'
            ? buildCampaignDetails()
            : undefined,
      };

      const draft =
        await createProjectApplicationDraft(
          input
        );

      await submitProjectApplication(
        draft.id
      );

      onSubmitted();
      onClose();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function buildProductDetails():
    ProductApplicationDetails {
    return {
      productName:
        productName.trim(),

      productDescription:
        productDescription.trim(),

      wholesalePrice:
        toNullableNumber(
          wholesalePrice
        ),

      proposedTicketPrice:
        toNullableNumber(
          proposedTicketPrice
        ),

      marginPerUnit:
        productMargin,

      availableUnits:
        toNullableNumber(
          availableUnits
        ),

      minimumOrderUnits:
        toNullableNumber(
          minimumOrderUnits
        ),

      productionCapacity:
        productionCapacity.trim(),

      deliveryConditions:
        deliveryConditions.trim(),

      legalRestrictions:
        legalRestrictions.trim(),

      storageRequirements:
        storageRequirements.trim(),

      compatibleExperiences:
        splitList(
          compatibleExperiences
        ),
    };
  }

  function buildExperienceDetails():
    ExperienceApplicationDetails {
    return {
      experienceName:
        project.title,

      experienceType:
        applicationType,

      expectedParticipants:
        toNullableNumber(
          expectedParticipants
        ),

      estimatedTicketPrice:
        toNullableNumber(
          estimatedTicketPrice
        ),

      preferredCities:
        splitList(
          preferredCities
        ),

      spaceRequirements:
        spaceRequirements.trim(),

      technicalRequirements:
        technicalRequirements.trim(),

      proposedDates:
        proposedDates.trim(),
    };
  }

  function buildCampaignDetails():
    CampaignApplicationDetails {
    return {
      campaignObjective:
        campaignObjective.trim(),

      targetAudience:
        campaignTargetAudience.trim(),

      estimatedReach:
        toNullableNumber(
          estimatedReach
        ),

      availableBudget:
        toNullableNumber(
          availableBudget
        ),

      requiredProfiles:
        splitList(
          requiredProfiles
        ),

      requiredSpaces:
        splitList(
          requiredSpaces
        ),

      expectedDeliverables:
        splitList(
          expectedDeliverables
        ),
    };
  }

  function toggleRoute(
    route:
      ProjectApplicationRoute
  ) {
    setRequestedRoutes(
      (current) =>
        current.includes(route)
          ? current.filter(
              (item) =>
                item !== route
            )
          : [
              ...current,
              route,
            ]
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-5xl rounded-[32px] border border-white/10 bg-[#090909] text-white shadow-2xl">
        <div className="flex items-start justify-between gap-6 border-b border-white/10 p-6 md:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D9FF00]">
              Aplicación al ecosistema
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              {project.title}
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#8F8F8F]">
              Comparte únicamente la información necesaria para que el
              ecosistema evalúe cómo conectar, activar, distribuir o
              acompañar este proyecto.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-[#A6A6A6] transition hover:border-white hover:text-white"
          >
            Cerrar
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-9 p-6 md:p-8"
        >
          <FormSection
            number="01"
            title="Identidad que aplica"
            description="Elige la persona, espacio, marca u organización desde la que presentas el proyecto."
          >
            {actors.length === 0 ? (
              <Notice>
                Esta cuenta todavía no tiene una identidad disponible.
              </Notice>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {actors.map(
                  (actor) => {
                    const selected =
                      actor.id ===
                      actorId;

                    return (
                      <button
                        key={actor.id}
                        type="button"
                        onClick={() =>
                          setActorId(
                            actor.id
                          )
                        }
                        className={[
                          'rounded-2xl border p-4 text-left transition',
                          selected
                            ? 'border-[#D9FF00] bg-[#D9FF00]/10'
                            : 'border-white/10 bg-[#111111] hover:border-white/30',
                        ].join(' ')}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#777777]">
                          {actorTypeLabel(
                            actor.type
                          )}
                        </p>

                        <h3 className="mt-2 font-semibold">
                          {actor.name}
                        </h3>

                        <p className="mt-2 text-xs text-[#777777]">
                          {actor.role}
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </FormSection>

          <FormSection
            number="02"
            title="Tipo de aplicación"
            description="Selecciona la ruta que mejor describe lo que quieres activar."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {applicationTypeOptions.map(
                (option) => {
                  const selected =
                    option.value ===
                    applicationType;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setApplicationType(
                          option.value
                        )
                      }
                      className={[
                        'rounded-2xl border p-4 text-left transition',
                        selected
                          ? 'border-[#D9FF00] bg-[#D9FF00]/10'
                          : 'border-white/10 bg-[#111111] hover:border-white/30',
                      ].join(' ')}
                    >
                      <h3 className="font-semibold">
                        {option.label}
                      </h3>

                      <p className="mt-2 text-xs leading-5 text-[#777777]">
                        {option.description}
                      </p>
                    </button>
                  );
                }
              )}
            </div>
          </FormSection>

          <FormSection
            number="03"
            title="Rutas solicitadas"
            description="Puedes seleccionar varias rutas. La administración decidirá cuál es viable."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {routeOptions.map(
                (route) => (
                  <label
                    key={route.value}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-[#111111] p-4"
                  >
                    <input
                      type="checkbox"
                      checked={requestedRoutes.includes(
                        route.value
                      )}
                      onChange={() =>
                        toggleRoute(
                          route.value
                        )
                      }
                      className="mt-1"
                    />

                    <span className="text-sm">
                      {route.label}
                    </span>
                  </label>
                )
              )}
            </div>
          </FormSection>

          <FormSection
            number="04"
            title="Ficha compartida"
            description="Estos datos serán visibles para la administración del ecosistema."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Resumen público"
                className="md:col-span-2"
              >
                <textarea
                  value={publicSummary}
                  onChange={(event) =>
                    setPublicSummary(
                      event.target.value
                    )
                  }
                  rows={5}
                  className={textareaClassName}
                />
              </Field>

              <Field label="Qué ofrece al ecosistema">
                <textarea
                  value={ecosystemOffer}
                  onChange={(event) =>
                    setEcosystemOffer(
                      event.target.value
                    )
                  }
                  rows={5}
                  className={textareaClassName}
                />
              </Field>

              <Field label="Qué necesita">
                <textarea
                  value={ecosystemNeeds}
                  onChange={(event) =>
                    setEcosystemNeeds(
                      event.target.value
                    )
                  }
                  rows={5}
                  className={textareaClassName}
                />
              </Field>

              <Field label="Público o comunidad">
                <textarea
                  value={targetAudience}
                  onChange={(event) =>
                    setTargetAudience(
                      event.target.value
                    )
                  }
                  rows={4}
                  className={textareaClassName}
                />
              </Field>

              <Field label="Alcance geográfico">
                <textarea
                  value={geographicScope}
                  onChange={(event) =>
                    setGeographicScope(
                      event.target.value
                    )
                  }
                  rows={4}
                  className={textareaClassName}
                />
              </Field>
            </div>
          </FormSection>

          {applicationType ===
          'product' ? (
            <ProductFields
              productName={productName}
              setProductName={setProductName}
              productDescription={productDescription}
              setProductDescription={setProductDescription}
              wholesalePrice={wholesalePrice}
              setWholesalePrice={setWholesalePrice}
              proposedTicketPrice={proposedTicketPrice}
              setProposedTicketPrice={setProposedTicketPrice}
              availableUnits={availableUnits}
              setAvailableUnits={setAvailableUnits}
              minimumOrderUnits={minimumOrderUnits}
              setMinimumOrderUnits={setMinimumOrderUnits}
              productionCapacity={productionCapacity}
              setProductionCapacity={setProductionCapacity}
              deliveryConditions={deliveryConditions}
              setDeliveryConditions={setDeliveryConditions}
              legalRestrictions={legalRestrictions}
              setLegalRestrictions={setLegalRestrictions}
              storageRequirements={storageRequirements}
              setStorageRequirements={setStorageRequirements}
              compatibleExperiences={compatibleExperiences}
              setCompatibleExperiences={setCompatibleExperiences}
              productMargin={productMargin}
            />
          ) : null}

          {applicationType ===
          'experience' ? (
            <FormSection
              number="05"
              title="Información de la experiencia"
              description="Ayuda a evaluar agenda, espacios y viabilidad operativa."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <InputField
                  label="Participantes esperados"
                  value={expectedParticipants}
                  onChange={setExpectedParticipants}
                  type="number"
                />

                <InputField
                  label="Precio estimado del ticket"
                  value={estimatedTicketPrice}
                  onChange={setEstimatedTicketPrice}
                  type="number"
                />

                <InputField
                  label="Ciudades preferidas"
                  value={preferredCities}
                  onChange={setPreferredCities}
                  placeholder="Bogotá, Medellín"
                />

                <InputField
                  label="Fechas propuestas"
                  value={proposedDates}
                  onChange={setProposedDates}
                  placeholder="Octubre de 2026"
                />

                <Field label="Requerimientos de espacio">
                  <textarea
                    value={spaceRequirements}
                    onChange={(event) =>
                      setSpaceRequirements(
                        event.target.value
                      )
                    }
                    rows={4}
                    className={textareaClassName}
                  />
                </Field>

                <Field label="Requerimientos técnicos">
                  <textarea
                    value={technicalRequirements}
                    onChange={(event) =>
                      setTechnicalRequirements(
                        event.target.value
                      )
                    }
                    rows={4}
                    className={textareaClassName}
                  />
                </Field>
              </div>
            </FormSection>
          ) : null}

          {applicationType ===
            'campaign' ||
          applicationType ===
            'activation' ? (
            <FormSection
              number="05"
              title="Información de campaña"
              description="Comparte el alcance y los recursos disponibles sin exponer el presupuesto interno completo."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Objetivo de campaña">
                  <textarea
                    value={campaignObjective}
                    onChange={(event) =>
                      setCampaignObjective(
                        event.target.value
                      )
                    }
                    rows={4}
                    className={textareaClassName}
                  />
                </Field>

                <Field label="Público objetivo">
                  <textarea
                    value={campaignTargetAudience}
                    onChange={(event) =>
                      setCampaignTargetAudience(
                        event.target.value
                      )
                    }
                    rows={4}
                    className={textareaClassName}
                  />
                </Field>

                <InputField
                  label="Alcance estimado"
                  value={estimatedReach}
                  onChange={setEstimatedReach}
                  type="number"
                />

                <InputField
                  label="Presupuesto disponible"
                  value={availableBudget}
                  onChange={setAvailableBudget}
                  type="number"
                />

                <InputField
                  label="Perfiles requeridos"
                  value={requiredProfiles}
                  onChange={setRequiredProfiles}
                  placeholder="Productor, fotógrafo, artista"
                />

                <InputField
                  label="Espacios requeridos"
                  value={requiredSpaces}
                  onChange={setRequiredSpaces}
                  placeholder="Galería, taller, restaurante"
                />

                <div className="md:col-span-2">
                  <InputField
                    label="Entregables esperados"
                    value={expectedDeliverables}
                    onChange={setExpectedDeliverables}
                    placeholder="Video, fotografías, evento, muestras"
                  />
                </div>
              </div>
            </FormSection>
          ) : null}

          <FormSection
            number="06"
            title="Privacidad"
            description="Antes de enviar, revisa qué información será compartida."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Notice
                accent
              >
                Se comparte: ficha de aplicación, módulos públicos
                seleccionados y datos comerciales que escribiste aquí.
              </Notice>

              <Notice>
                Permanece privado: conversación con Creative OS,
                documentos, presupuesto interno, tareas, decisiones,
                equipo, riesgos y evidencias.
              </Notice>
            </div>
          </FormSection>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedActor
              }
              className="rounded-full bg-[#D9FF00] px-7 py-3 text-sm font-bold text-black disabled:opacity-50"
            >
              {isSubmitting
                ? 'Enviando aplicación...'
                : 'Enviar al ecosistema'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductFields({
  productName,
  setProductName,
  productDescription,
  setProductDescription,
  wholesalePrice,
  setWholesalePrice,
  proposedTicketPrice,
  setProposedTicketPrice,
  availableUnits,
  setAvailableUnits,
  minimumOrderUnits,
  setMinimumOrderUnits,
  productionCapacity,
  setProductionCapacity,
  deliveryConditions,
  setDeliveryConditions,
  legalRestrictions,
  setLegalRestrictions,
  storageRequirements,
  setStorageRequirements,
  compatibleExperiences,
  setCompatibleExperiences,
  productMargin,
}: {
  productName: string;
  setProductName: (value: string) => void;
  productDescription: string;
  setProductDescription: (value: string) => void;
  wholesalePrice: string;
  setWholesalePrice: (value: string) => void;
  proposedTicketPrice: string;
  setProposedTicketPrice: (value: string) => void;
  availableUnits: string;
  setAvailableUnits: (value: string) => void;
  minimumOrderUnits: string;
  setMinimumOrderUnits: (value: string) => void;
  productionCapacity: string;
  setProductionCapacity: (value: string) => void;
  deliveryConditions: string;
  setDeliveryConditions: (value: string) => void;
  legalRestrictions: string;
  setLegalRestrictions: (value: string) => void;
  storageRequirements: string;
  setStorageRequirements: (value: string) => void;
  compatibleExperiences: string;
  setCompatibleExperiences: (value: string) => void;
  productMargin: number | null;
}) {
  return (
    <FormSection
      number="05"
      title="Información comercial del producto"
      description="Esta información permite evaluar si el producto puede integrarse a tickets, experiencias o activaciones."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <InputField
          label="Nombre del producto"
          value={productName}
          onChange={setProductName}
        />

        <InputField
          label="Costo mayorista por unidad"
          value={wholesalePrice}
          onChange={setWholesalePrice}
          type="number"
        />

        <div className="md:col-span-2">
          <Field label="Descripción del producto">
            <textarea
              value={productDescription}
              onChange={(event) =>
                setProductDescription(
                  event.target.value
                )
              }
              rows={4}
              className={textareaClassName}
            />
          </Field>
        </div>

        <InputField
          label="Precio propuesto dentro del ticket"
          value={proposedTicketPrice}
          onChange={setProposedTicketPrice}
          type="number"
        />

        <InputField
          label="Margen estimado por unidad"
          value={
            productMargin === null
              ? ''
              : String(
                  productMargin
                )
          }
          onChange={() => {}}
          type="number"
          disabled
        />

        <InputField
          label="Unidades disponibles"
          value={availableUnits}
          onChange={setAvailableUnits}
          type="number"
        />

        <InputField
          label="Pedido mínimo"
          value={minimumOrderUnits}
          onChange={setMinimumOrderUnits}
          type="number"
        />

        <InputField
          label="Capacidad de producción"
          value={productionCapacity}
          onChange={setProductionCapacity}
        />

        <InputField
          label="Condiciones de entrega"
          value={deliveryConditions}
          onChange={setDeliveryConditions}
        />

        <InputField
          label="Restricciones legales"
          value={legalRestrictions}
          onChange={setLegalRestrictions}
        />

        <InputField
          label="Requisitos de almacenamiento"
          value={storageRequirements}
          onChange={setStorageRequirements}
        />

        <div className="md:col-span-2">
          <InputField
            label="Experiencias compatibles"
            value={compatibleExperiences}
            onChange={setCompatibleExperiences}
            placeholder="Talleres creativos, conciertos, festivales"
          />
        </div>
      </div>
    </FormSection>
  );
}

function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D9FF00]">
          {number}
        </p>

        <h3 className="mt-2 text-2xl font-bold">
          {title}
        </h3>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#777777]">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  className = '',
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-medium text-[#BDBDBD]">
        {label}
      </span>

      {children}
    </label>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        disabled={disabled}
        className={inputClassName}
      />
    </Field>
  );
}

function Notice({
  children,
  accent = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        'rounded-2xl border p-4 text-sm leading-6',
        accent
          ? 'border-[#D9FF00]/20 bg-[#D9FF00]/5 text-[#D9FF00]'
          : 'border-white/10 bg-[#111111] text-[#A6A6A6]',
      ].join(' ')}
    >
      {children}
    </div>
  );
}

function createTemporarySnapshot(
  project: CloudProjectSummary
) {
  return {
    projectTitle:
      project.title,
    projectDescription:
      project.description,
    projectCategory:
      project.category,
    projectStage:
      project.stage as any,
    projectProgress:
      project.progress,
    identity: '',
    purpose: '',
    problem: '',
    context: '',
    community: '',
    generalObjective: '',
    specificObjectives: '',
    activities: '',
    timeline: '',
    allies: '',
    sustainability: '',
    impact: '',
    kpis: '',
  };
}

function getRawActorId(
  actorId: string
): string {
  const separatorIndex =
    actorId.indexOf(':');

  return separatorIndex >= 0
    ? actorId.slice(
        separatorIndex + 1
      )
    : actorId;
}

function actorTypeLabel(
  type: WorkspaceActor['type']
): string {
  switch (type) {
    case 'person':
      return 'Persona';

    case 'space':
      return 'Espacio';

    case 'funder':
      return 'Marca u organización';
  }
}

function toNullableNumber(
  value: string
): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function splitList(
  value: string
): string[] {
  return value
    .split(',')
    .map(
      (item) =>
        item.trim()
    )
    .filter(Boolean);
}

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado.';
}

const inputClassName =
  'w-full rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none transition placeholder:text-[#555555] focus:border-[#D9FF00] disabled:cursor-not-allowed disabled:opacity-60';

const textareaClassName =
  'w-full resize-none rounded-2xl border border-white/10 bg-[#111111] p-4 text-white outline-none transition placeholder:text-[#555555] focus:border-[#D9FF00]';