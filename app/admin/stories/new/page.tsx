import { EditorialCmsNav } from '@/components/editorial/EditorialCmsNav';
import { EditorialPostEditor } from '@/components/editorial/EditorialPostEditor';
import { canAccessWorkspace } from '@/services/auth/workspace';
export default async function NewStoryPage(){const access=await canAccessWorkspace();return <><EditorialCmsNav/><EditorialPostEditor canPublish={Boolean(access.capabilities?.canPublishEditorial)}/></>}
