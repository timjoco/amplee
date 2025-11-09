import InviteClient from './InviteClient';

type RouteParams = { token: string };

export default async function InvitePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { token } = await params;
  return <InviteClient token={token} />;
}
