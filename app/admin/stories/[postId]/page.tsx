import { EditorialCmsNav } from '@/components/editorial/EditorialCmsNav';
import { EditorialPostEditor } from '@/components/editorial/EditorialPostEditor';
import { canAccessWorkspace } from '@/services/auth/workspace';
export default async function EditStoryPage({params}:{params:Promise<{postId:string}>}){const [{postId},access]=await Promise.all([params,canAccessWorkspace()]);return <><EditorialCmsNav/><EditorialPostEditor postId={postId} canPublish={Boolean(access.capabilities?.canPublishEditorial)}/></>}
