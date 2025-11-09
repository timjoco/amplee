/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../../../../lib/supabaseServer';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; proposalId: string }> }
) {
  try {
    const { id: bandId, proposalId } = await context.params;
    const { optionId, eventType } = await request.json();

    if (!optionId) {
      return NextResponse.json({ error: 'Missing optionId' }, { status: 400 });
    }

    const type: 'show' | 'practice' =
      eventType === 'practice' ? 'practice' : 'show';

    const sb = await supabaseServer();

    const { data: proposal, error: propErr } = await sb
      .from('gig_proposals')
      .select('id, band_id, title, venue')
      .eq('id', proposalId)
      .maybeSingle();

    if (propErr || !proposal) {
      return NextResponse.json(
        { error: propErr?.message || 'Proposal not found' },
        { status: 404 }
      );
    }
    if (proposal.band_id !== bandId) {
      return NextResponse.json({ error: 'Band mismatch' }, { status: 403 });
    }

    const { data: option, error: optErr } = await sb
      .from('gig_proposal_options')
      .select('id, proposal_id, starts_at')
      .eq('id', optionId)
      .maybeSingle();

    if (optErr || !option) {
      return NextResponse.json(
        { error: optErr?.message || 'Option not found' },
        { status: 404 }
      );
    }
    if (option.proposal_id !== proposalId) {
      return NextResponse.json(
        { error: 'Option does not belong to this proposal' },
        { status: 400 }
      );
    }

    const { data: event, error: evtErr } = await sb
      .from('events')
      .insert([
        {
          band_id: bandId,
          title: proposal.title ?? 'New Event',
          type,
          starts_at: option.starts_at,
          location: proposal.venue ?? null,
          notes: null,
        },
      ])
      .select()
      .single();

    if (evtErr) {
      return NextResponse.json({ error: evtErr.message }, { status: 400 });
    }

    await sb.from('gig_proposal_votes').delete().eq('proposal_id', proposalId);
    await sb
      .from('gig_proposal_options')
      .delete()
      .eq('proposal_id', proposalId);
    await sb.from('gig_proposals').delete().eq('id', proposalId);

    return NextResponse.json({ event });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
