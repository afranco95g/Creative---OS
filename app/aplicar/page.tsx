import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { ProjectImportFlow } from '../../components/projects/ProjectImportFlow';
export default async function PublicApplicationPage(){const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect('/login?redirect=/aplicar');return <ProjectImportFlow publicMode/>;}
