import type { Metadata } from 'next';import { EditorialPreviewPane } from '@/components/editorial/EditorialPreviewPane';
export const metadata:Metadata={robots:{index:false,follow:false}};
export default async function PreviewPage({params}:{params:Promise<{postId:string}>}){const{postId}=await params;return <EditorialPreviewPane postId={postId}/>}
