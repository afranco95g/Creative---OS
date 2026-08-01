import {
  supabase,
} from '../../lib/supabase/client';

export type FundingOpportunityType =
  | 'grant'
  | 'sponsorship'
  | 'commission'
  | 'partnership'
  | 'residency'
  | 'call'
  | 'other';

export type FundingOpportunityStatus =
  | 'draft'
  | 'submitted'
  | 'published'
  | 'rejected'
  | 'closed'
  | 'archived';

export interface FundingOpportunity {
  id: string;
  ownerId: string;
  ownerName: string;

  title: string;
  summary: string;
  description: string;

  opportunityType:
    FundingOpportunityType;

  amountMin: number | null;
  amountMax: number | null;
  currency: string;

  opensAt: string | null;
  closesAt: string | null;

  eligibility: string;
  requiredDocuments: string[];

  status:
    FundingOpportunityStatus;

  reviewNote: string;
  publishedAt: string | null;

  isOwner: boolean;
  canReview: boolean;
}

export interface FundingOpportunityFormInput {
  title: string;
  summary: string;
  description: string;

  opportunityType:
    FundingOpportunityType;

  amountMin: string;
  amountMax: string;
  currency: string;

  opensAt: string;
  closesAt: string;

  eligibility: string;
  requiredDocumentsText: string;
}

interface FundingOpportunityRow {
  id: string;
  owner_id: string;
  owner_name: string;

  title: string;
  summary: string;
  description: string;

  opportunity_type:
    FundingOpportunityType;

  amount_min:
    number | string | null;

  amount_max:
    number | string | null;

  currency: string;

  opens_at: string | null;
  closes_at: string | null;

  eligibility: string;

  required_documents:
    string[] | null;

  opportunity_status:
    FundingOpportunityStatus;

  review_note: string;
  published_at: string | null;

  is_owner: boolean;
  can_review: boolean;
}

function getDatabase() {
  return supabase as any;
}

export async function loadManageableFundingOpportunities():
  Promise<FundingOpportunity[]> {
  const database =
    getDatabase();

  const {
    data,
    error,
  } = await database.rpc(
    'list_manageable_funding_opportunities'
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible cargar las oportunidades.'
    );
  }

  const rows =
    (
      data ?? []
    ) as FundingOpportunityRow[];

  return rows.map(
    mapFundingOpportunity
  );
}

export async function saveFundingOpportunity(
  opportunityId: string | null,
  input:
    FundingOpportunityFormInput
): Promise<string> {
  validateInput(input);

  const database =
    getDatabase();

  const {
    data,
    error,
  } = await database.rpc(
    'save_funding_opportunity',
    {
      target_opportunity_id:
        opportunityId,

      target_title:
        input.title.trim(),

      target_summary:
        input.summary.trim(),

      target_description:
        input.description.trim(),

      target_opportunity_type:
        input.opportunityType,

      target_amount_min:
        parseOptionalNumber(
          input.amountMin
        ),

      target_amount_max:
        parseOptionalNumber(
          input.amountMax
        ),

      target_currency:
        input.currency,

      target_opens_at:
        input.opensAt ||
        null,

      target_closes_at:
        input.closesAt ||
        null,

      target_eligibility:
        input.eligibility.trim(),

      target_required_documents:
        parseLines(
          input.requiredDocumentsText
        ),
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible guardar la oportunidad.'
    );
  }

  if (
    typeof data !==
    'string'
  ) {
    throw new Error(
      'La oportunidad fue guardada, pero no devolvió un identificador válido.'
    );
  }

  return data;
}

export async function submitFundingOpportunity(
  opportunityId: string
): Promise<void> {
  const database =
    getDatabase();

  const {
    error,
  } = await database.rpc(
    'submit_funding_opportunity',
    {
      target_opportunity_id:
        opportunityId,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible enviar la oportunidad a revisión.'
    );
  }
}

export async function reviewFundingOpportunity(
  opportunityId: string,
  approved: boolean,
  note: string
): Promise<void> {
  const database =
    getDatabase();

  const {
    error,
  } = await database.rpc(
    'review_funding_opportunity',
    {
      target_opportunity_id:
        opportunityId,

      approve_opportunity:
        approved,

      reviewer_note:
        note,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible revisar la oportunidad.'
    );
  }
}

function mapFundingOpportunity(
  row:
    FundingOpportunityRow
): FundingOpportunity {
  return {
    id:
      row.id,

    ownerId:
      row.owner_id,

    ownerName:
      row.owner_name,

    title:
      row.title,

    summary:
      row.summary,

    description:
      row.description,

    opportunityType:
      row.opportunity_type,

    amountMin:
      row.amount_min ===
      null
        ? null
        : Number(
            row.amount_min
          ),

    amountMax:
      row.amount_max ===
      null
        ? null
        : Number(
            row.amount_max
          ),

    currency:
      row.currency,

    opensAt:
      row.opens_at,

    closesAt:
      row.closes_at,

    eligibility:
      row.eligibility,

    requiredDocuments:
      Array.isArray(
        row.required_documents
      )
        ? row.required_documents
        : [],

    status:
      row.opportunity_status,

    reviewNote:
      row.review_note,

    publishedAt:
      row.published_at,

    isOwner:
      Boolean(
        row.is_owner
      ),

    canReview:
      Boolean(
        row.can_review
      ),
  };
}

function validateInput(
  input:
    FundingOpportunityFormInput
) {
  const amountMin =
    parseOptionalNumber(
      input.amountMin
    );

  const amountMax =
    parseOptionalNumber(
      input.amountMax
    );

  if (
    amountMin !== null &&
    amountMax !== null &&
    amountMax < amountMin
  ) {
    throw new Error(
      'El monto máximo debe ser mayor o igual al mínimo.'
    );
  }

  if (
    input.opensAt &&
    input.closesAt &&
    input.closesAt <
      input.opensAt
  ) {
    throw new Error(
      'La fecha de cierre debe ser posterior a la apertura.'
    );
  }
}

function parseOptionalNumber(
  value: string
): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed =
    Number(value);

  if (
    Number.isNaN(parsed) ||
    parsed < 0
  ) {
    throw new Error(
      'Los montos deben ser números positivos.'
    );
  }

  return parsed;
}

function parseLines(
  value: string
): string[] {
  return value
    .split('\n')
    .map(
      (item) =>
        item.trim()
    )
    .filter(Boolean);
}