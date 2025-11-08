import { notFound } from 'next/navigation';
import ProposedGigSheetClient from './ProposedGigSheetClient';

type PageProps = {
  params: Promise<{ id: string; proposalId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id, proposalId } = await params; // unwrap Next 15 promise-style params
  if (!id || !proposalId) notFound();

  return <ProposedGigSheetClient bandId={id} proposalId={proposalId} />;
}
