import {
  createClient,
} from '../../lib/supabase/server';

export interface PublicFundingOpportunity {
  id: string;
  ownerName: string;

  title: string;
  summary: string;
  description: string;
  opportunityType: string;

  amountMin: number | null;
  amountMax: number | null;
  currency: string;

  opensAt: string | null;
  closesAt: string | null;

  eligibility: string;
  requiredDocuments: string[];

  publishedAt: string;
  applicationsCount: number;
}

interface PublicFundingOpportunityRow {
  id: string;
  owner_name: string;

  title: string;
  summary: string;
  description: string;
  opportunity_type: string;

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

  published_at: string;

  applications_count?: number;
}

export async function listPublishedFundingOpportunities():
  Promise<PublicFundingOpportunity[]> {
  const supabase =
    await createClient();

  const database =
    supabase as any;

  const {
    data,
    error,
  } = await database.rpc(
    'list_published_funding_opportunities'
  );

  if (error) {
    console.error(
      'Error loading funding opportunities:',
      error
    );

    throw new Error(
      'No fue posible cargar las oportunidades.'
    );
  }

  const rows =
    (
      data ?? []
    ) as PublicFundingOpportunityRow[];

  return rows.map(
    mapPublicFundingOpportunity
  );
}

export async function getPublishedFundingOpportunity(
  opportunityId: string
): Promise<PublicFundingOpportunity | null> {
  if (!isUuid(opportunityId)) {
    return null;
  }

  const supabase =
    await createClient();

  const database =
    supabase as any;

  const {
    data,
    error,
  } = await database.rpc(
    'get_published_funding_opportunity_by_id',
    {
      target_opportunity_id:
        opportunityId,
    }
  );

  if (error) {
    console.error(
      'Error loading funding opportunity:',
      error
    );

    throw new Error(
      'No fue posible cargar la oportunidad.'
    );
  }

  const rows =
    (
      data ?? []
    ) as PublicFundingOpportunityRow[];

  const row =
    rows[0];

  return row
    ? mapPublicFundingOpportunity(
        row
      )
    : null;
}

function mapPublicFundingOpportunity(
  row:
    PublicFundingOpportunityRow
): PublicFundingOpportunity {
  return {
    id:
      row.id,

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

    publishedAt:
      row.published_at,

    applicationsCount:
      Number(
        row.applications_count ??
        0
      ),
  };
}

function isUuid(
  value: string
): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}