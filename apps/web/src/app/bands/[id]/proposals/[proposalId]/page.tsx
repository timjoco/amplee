import { notFound } from 'next/navigation';
import ProposedGigSheetClient from './ProposedGigSheetClient';

type Props = {
  params: Promise<{ id: string; proposalId: string }>;
};

export default async function Page({ params }: Props) {
  const { id, proposalId } = await params;
  if (!id || !proposalId) notFound();

  return <ProposedGigSheetClient bandId={id} proposalId={proposalId} />;
}
