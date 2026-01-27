-- RLS Performance Fix Part 2: Optimize auth.uid() calls
-- Wrapping auth.uid() in (select auth.uid()) forces evaluation once per query instead of per row

-- ============================================================
-- profiles
-- ============================================================

DROP POLICY IF EXISTS "profiles_select_shared_band" ON profiles;
CREATE POLICY "profiles_select_shared_band" ON profiles FOR SELECT
USING ((id = (select auth.uid())) OR _share_any_band(id));

DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;
CREATE POLICY "profiles_insert_self" ON profiles FOR INSERT
WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE
USING (id = (select auth.uid()))
WITH CHECK (id = (select auth.uid()));


-- ============================================================
-- users
-- ============================================================

DROP POLICY IF EXISTS "users_select_self_or_bandmates" ON users;
CREATE POLICY "users_select_self_or_bandmates" ON users FOR SELECT
USING ((id = (select auth.uid())) OR (EXISTS (
  SELECT 1 FROM band_members m1
  JOIN band_members m2 ON m2.band_id = m1.band_id
  WHERE m1.user_id = (select auth.uid()) AND m2.user_id = users.id
)));

DROP POLICY IF EXISTS "users_insert_self" ON users;
CREATE POLICY "users_insert_self" ON users FOR INSERT
WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "users_update_self" ON users;
CREATE POLICY "users_update_self" ON users FOR UPDATE
USING (id = (select auth.uid()))
WITH CHECK (id = (select auth.uid()));


-- ============================================================
-- bands
-- ============================================================

DROP POLICY IF EXISTS "bands: members can read" ON bands;
CREATE POLICY "bands: members can read" ON bands FOR SELECT
USING (EXISTS (
  SELECT 1 FROM band_members m
  WHERE m.band_id = bands.id AND m.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "bands: admins can update" ON bands;
CREATE POLICY "bands: admins can update" ON bands FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM band_members m
  WHERE m.band_id = bands.id AND m.user_id = (select auth.uid()) AND m.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM band_members m
  WHERE m.band_id = bands.id AND m.user_id = (select auth.uid()) AND m.role = 'admin'
));

DROP POLICY IF EXISTS "bands: delete admin only" ON bands;
CREATE POLICY "bands: delete admin only" ON bands FOR DELETE
USING (EXISTS (
  SELECT 1 FROM band_members m
  WHERE m.band_id = bands.id AND m.user_id = (select auth.uid()) AND m.role = 'admin'
));

DROP POLICY IF EXISTS "admins can update contact settings" ON bands;
CREATE POLICY "admins can update contact settings" ON bands FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM band_members bm
  WHERE bm.band_id = bands.id AND bm.user_id = (select auth.uid()) AND bm.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM band_members bm
  WHERE bm.band_id = bands.id AND bm.user_id = (select auth.uid()) AND bm.role = 'admin'
));


-- ============================================================
-- band_members
-- ============================================================

DROP POLICY IF EXISTS "admins can add members to their band" ON band_members;
CREATE POLICY "admins can add members to their band" ON band_members FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM band_members m2
  WHERE m2.band_id = band_members.band_id AND m2.user_id = (select auth.uid()) AND m2.role = 'admin'
));

DROP POLICY IF EXISTS "bm: read rows for bands I belong to" ON band_members;
CREATE POLICY "bm: read rows for bands I belong to" ON band_members FOR SELECT
USING ((user_id = (select auth.uid())) OR is_my_band(band_id));

DROP POLICY IF EXISTS "bm: update own row" ON band_members;
CREATE POLICY "bm: update own row" ON band_members FOR UPDATE
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "bm: delete own row" ON band_members;
CREATE POLICY "bm: delete own row" ON band_members FOR DELETE
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "users_can_insert_self_as_member_or_admin" ON band_members;
CREATE POLICY "users_can_insert_self_as_member_or_admin" ON band_members FOR INSERT
WITH CHECK ((user_id = (select auth.uid())) AND (role = ANY (ARRAY['member'::membership_role, 'admin'::membership_role])));

DROP POLICY IF EXISTS "Members can update their own band_role" ON band_members;
CREATE POLICY "Members can update their own band_role" ON band_members FOR UPDATE
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Band admins can update members" ON band_members;
CREATE POLICY "Band admins can update members" ON band_members FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM band_members bm2
  WHERE bm2.band_id = band_members.band_id AND bm2.user_id = (select auth.uid()) AND bm2.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM band_members bm2
  WHERE bm2.band_id = band_members.band_id AND bm2.user_id = (select auth.uid()) AND bm2.role = 'admin'
));


-- ============================================================
-- band_invitations
-- ============================================================

DROP POLICY IF EXISTS "band_invitations: admins can insert" ON band_invitations;
CREATE POLICY "band_invitations: admins can insert" ON band_invitations FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM band_members bm
  WHERE bm.band_id = band_invitations.band_id AND bm.user_id = (select auth.uid()) AND bm.role = 'admin'
));

DROP POLICY IF EXISTS "band_invitations: admins can select" ON band_invitations;
CREATE POLICY "band_invitations: admins can select" ON band_invitations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM band_members bm
  WHERE bm.band_id = band_invitations.band_id AND bm.user_id = (select auth.uid()) AND bm.role = 'admin'
));

DROP POLICY IF EXISTS "band_invitations: admins can update pending" ON band_invitations;
CREATE POLICY "band_invitations: admins can update pending" ON band_invitations FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM band_members bm
  WHERE bm.band_id = band_invitations.band_id AND bm.user_id = (select auth.uid()) AND bm.role = 'admin'
))
WITH CHECK (status = 'pending'::invite_status);


-- ============================================================
-- band_genres
-- ============================================================

DROP POLICY IF EXISTS "band_genres_select_members" ON band_genres;
CREATE POLICY "band_genres_select_members" ON band_genres FOR SELECT
USING (EXISTS (
  SELECT 1 FROM band_members bm
  WHERE bm.band_id = band_genres.band_id AND bm.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "band_genres_modify_admins" ON band_genres;
CREATE POLICY "band_genres_modify_admins" ON band_genres FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM band_members bm
  WHERE bm.band_id = band_genres.band_id AND bm.user_id = (select auth.uid()) AND bm.role = 'admin'
));

DROP POLICY IF EXISTS "band_genres_update_admins" ON band_genres;
CREATE POLICY "band_genres_update_admins" ON band_genres FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM band_members bm
  WHERE bm.band_id = band_genres.band_id AND bm.user_id = (select auth.uid()) AND bm.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM band_members bm
  WHERE bm.band_id = band_genres.band_id AND bm.user_id = (select auth.uid()) AND bm.role = 'admin'
));

DROP POLICY IF EXISTS "band_genres_delete_admins" ON band_genres;
CREATE POLICY "band_genres_delete_admins" ON band_genres FOR DELETE
USING (EXISTS (
  SELECT 1 FROM band_members bm
  WHERE bm.band_id = band_genres.band_id AND bm.user_id = (select auth.uid()) AND bm.role = 'admin'
));


-- ============================================================
-- events
-- ============================================================

DROP POLICY IF EXISTS "events: members can read" ON events;
CREATE POLICY "events: members can read" ON events FOR SELECT
USING (EXISTS (
  SELECT 1 FROM band_members m
  WHERE m.band_id = events.band_id AND m.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "events: insert band member" ON events;
CREATE POLICY "events: insert band member" ON events FOR INSERT
WITH CHECK ((created_by = (select auth.uid())) AND (EXISTS (
  SELECT 1 FROM band_members m
  WHERE m.band_id = events.band_id AND m.user_id = (select auth.uid())
)));

DROP POLICY IF EXISTS "events: update creator" ON events;
CREATE POLICY "events: update creator" ON events FOR UPDATE
USING (created_by = (select auth.uid()))
WITH CHECK (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "events: delete creator" ON events;
CREATE POLICY "events: delete creator" ON events FOR DELETE
USING (created_by = (select auth.uid()));


-- ============================================================
-- event_attendance
-- ============================================================

DROP POLICY IF EXISTS "select attendance if band member" ON event_attendance;
CREATE POLICY "select attendance if band member" ON event_attendance FOR SELECT
USING (EXISTS (
  SELECT 1 FROM events e
  JOIN band_members bm ON bm.band_id = e.band_id
  WHERE e.id = event_attendance.event_id AND bm.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "ea: insert self" ON event_attendance;
CREATE POLICY "ea: insert self" ON event_attendance FOR INSERT
WITH CHECK (is_event_member(event_id) AND (user_id = (select auth.uid())));

DROP POLICY IF EXISTS "ea: update self or admin" ON event_attendance;
CREATE POLICY "ea: update self or admin" ON event_attendance FOR UPDATE
USING (is_event_member(event_id) AND ((user_id = (select auth.uid())) OR is_event_admin(event_id)))
WITH CHECK (is_event_member(event_id));


-- ============================================================
-- event_messages
-- ============================================================

DROP POLICY IF EXISTS "em: select band" ON event_messages;
CREATE POLICY "em: select band" ON event_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM events e
  JOIN band_members m ON m.band_id = e.band_id
  WHERE e.id = event_messages.event_id AND m.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "em: insert band" ON event_messages;
CREATE POLICY "em: insert band" ON event_messages FOR INSERT
WITH CHECK ((user_id = (select auth.uid())) AND (EXISTS (
  SELECT 1 FROM events e
  JOIN band_members m ON m.band_id = e.band_id
  WHERE e.id = event_messages.event_id AND m.user_id = (select auth.uid())
)));

DROP POLICY IF EXISTS "em: update own or admin" ON event_messages;
CREATE POLICY "em: update own or admin" ON event_messages FOR UPDATE
USING ((user_id = (select auth.uid())) OR (EXISTS (
  SELECT 1 FROM events e
  JOIN band_members m ON m.band_id = e.band_id
  WHERE e.id = event_messages.event_id AND m.user_id = (select auth.uid()) AND m.role = 'admin'
)))
WITH CHECK ((user_id = (select auth.uid())) OR (EXISTS (
  SELECT 1 FROM events e
  JOIN band_members m ON m.band_id = e.band_id
  WHERE e.id = event_messages.event_id AND m.user_id = (select auth.uid()) AND m.role = 'admin'
)));

DROP POLICY IF EXISTS "em: delete admin" ON event_messages;
CREATE POLICY "em: delete admin" ON event_messages FOR DELETE
USING (EXISTS (
  SELECT 1 FROM events e
  JOIN band_members m ON m.band_id = e.band_id
  WHERE e.id = event_messages.event_id AND m.user_id = (select auth.uid()) AND m.role = 'admin'
));


-- ============================================================
-- event_message_reactions
-- ============================================================

DROP POLICY IF EXISTS "emr: delete self or admin" ON event_message_reactions;
CREATE POLICY "emr: delete self or admin" ON event_message_reactions FOR DELETE
USING ((user_id = (select auth.uid())) OR is_privileged_for_reaction(message_id));


-- ============================================================
-- event_message_reads
-- ============================================================

DROP POLICY IF EXISTS "Users can view own read status" ON event_message_reads;
CREATE POLICY "Users can view own read status" ON event_message_reads FOR SELECT
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own read status" ON event_message_reads;
CREATE POLICY "Users can insert own read status" ON event_message_reads FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own read status" ON event_message_reads;
CREATE POLICY "Users can update own read status" ON event_message_reads FOR UPDATE
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);


-- ============================================================
-- event_members
-- ============================================================

DROP POLICY IF EXISTS "Band members can view event members" ON event_members;
CREATE POLICY "Band members can view event members" ON event_members FOR SELECT
USING (EXISTS (
  SELECT 1 FROM events e
  JOIN band_members bm ON bm.band_id = e.band_id
  WHERE e.id = event_members.event_id AND bm.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "Band admins can insert event members" ON event_members;
CREATE POLICY "Band admins can insert event members" ON event_members FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM events e
  JOIN band_members bm ON bm.band_id = e.band_id
  WHERE e.id = event_members.event_id AND bm.user_id = (select auth.uid()) AND bm.role = 'admin'
));

DROP POLICY IF EXISTS "Band admins can update event members" ON event_members;
CREATE POLICY "Band admins can update event members" ON event_members FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM events e
  JOIN band_members bm ON bm.band_id = e.band_id
  WHERE e.id = event_members.event_id AND bm.user_id = (select auth.uid()) AND bm.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM events e
  JOIN band_members bm ON bm.band_id = e.band_id
  WHERE e.id = event_members.event_id AND bm.user_id = (select auth.uid()) AND bm.role = 'admin'
));

DROP POLICY IF EXISTS "Band admins can delete event members" ON event_members;
CREATE POLICY "Band admins can delete event members" ON event_members FOR DELETE
USING (EXISTS (
  SELECT 1 FROM events e
  JOIN band_members bm ON bm.band_id = e.band_id
  WHERE e.id = event_members.event_id AND bm.user_id = (select auth.uid()) AND bm.role = 'admin'
));


-- ============================================================
-- event_files
-- ============================================================

DROP POLICY IF EXISTS "Band members can view event files" ON event_files;
CREATE POLICY "Band members can view event files" ON event_files FOR SELECT
USING (EXISTS (
  SELECT 1 FROM band_members
  WHERE band_members.band_id = event_files.band_id AND band_members.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "Admins can upload event files" ON event_files;
CREATE POLICY "Admins can upload event files" ON event_files FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM band_members
  WHERE band_members.band_id = event_files.band_id AND band_members.user_id = (select auth.uid()) AND band_members.role = 'admin'
));

DROP POLICY IF EXISTS "Admins can delete event files" ON event_files;
CREATE POLICY "Admins can delete event files" ON event_files FOR DELETE
USING (EXISTS (
  SELECT 1 FROM band_members
  WHERE band_members.band_id = event_files.band_id AND band_members.user_id = (select auth.uid()) AND band_members.role = 'admin'
));


-- ============================================================
-- event_setlist_items
-- ============================================================

DROP POLICY IF EXISTS "Band members can view event setlist items" ON event_setlist_items;
CREATE POLICY "Band members can view event setlist items" ON event_setlist_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM event_members em
  JOIN events e ON e.id = em.event_id
  WHERE em.event_id = event_setlist_items.event_id AND em.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "Band members can insert event setlist items" ON event_setlist_items;
CREATE POLICY "Band members can insert event setlist items" ON event_setlist_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM event_members em
  WHERE em.event_id = event_setlist_items.event_id AND em.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "Band members can update event setlist items" ON event_setlist_items;
CREATE POLICY "Band members can update event setlist items" ON event_setlist_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM event_members em
  WHERE em.event_id = event_setlist_items.event_id AND em.user_id = (select auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM event_members em
  WHERE em.event_id = event_setlist_items.event_id AND em.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "Band admins can delete event setlist items" ON event_setlist_items;
CREATE POLICY "Band admins can delete event setlist items" ON event_setlist_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM event_members em
  JOIN events e ON e.id = em.event_id
  JOIN band_members bm ON bm.band_id = e.band_id AND bm.user_id = (select auth.uid())
  WHERE em.event_id = event_setlist_items.event_id AND bm.role = 'admin'
));


-- ============================================================
-- songs
-- ============================================================

DROP POLICY IF EXISTS "Songs: band members can read" ON songs;
CREATE POLICY "Songs: band members can read" ON songs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM band_members bm
  WHERE bm.band_id = songs.band_id AND bm.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "Songs: admins/editors can create" ON songs;
CREATE POLICY "Songs: admins/editors can create" ON songs FOR INSERT
WITH CHECK ((EXISTS (
  SELECT 1 FROM band_members bm
  WHERE bm.band_id = songs.band_id AND bm.user_id = (select auth.uid()) AND bm.role = ANY (ARRAY['admin'::membership_role, 'editor'::membership_role])
)) AND ((created_by IS NULL) OR (created_by = (select auth.uid()))));

DROP POLICY IF EXISTS "Songs: admins/editors can update" ON songs;
CREATE POLICY "Songs: admins/editors can update" ON songs FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM band_members bm
  WHERE bm.band_id = songs.band_id AND bm.user_id = (select auth.uid()) AND bm.role = ANY (ARRAY['admin'::membership_role, 'editor'::membership_role])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM band_members bm
  WHERE bm.band_id = songs.band_id AND bm.user_id = (select auth.uid()) AND bm.role = ANY (ARRAY['admin'::membership_role, 'editor'::membership_role])
));

DROP POLICY IF EXISTS "Songs: admins can delete" ON songs;
CREATE POLICY "Songs: admins can delete" ON songs FOR DELETE
USING (EXISTS (
  SELECT 1 FROM band_members bm
  WHERE bm.band_id = songs.band_id AND bm.user_id = (select auth.uid()) AND bm.role = 'admin'
));


-- ============================================================
-- song_recordings
-- ============================================================

DROP POLICY IF EXISTS "Band members can view song recordings" ON song_recordings;
CREATE POLICY "Band members can view song recordings" ON song_recordings FOR SELECT
USING (EXISTS (
  SELECT 1 FROM songs s
  JOIN band_members bm ON bm.band_id = s.band_id
  WHERE s.id = song_recordings.song_id AND bm.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "Band members can add song recordings" ON song_recordings;
CREATE POLICY "Band members can add song recordings" ON song_recordings FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM songs s
  JOIN band_members bm ON bm.band_id = s.band_id
  WHERE s.id = song_recordings.song_id AND bm.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "Band admins can delete song recordings" ON song_recordings;
CREATE POLICY "Band admins can delete song recordings" ON song_recordings FOR DELETE
USING (EXISTS (
  SELECT 1 FROM songs s
  JOIN band_members bm ON bm.band_id = s.band_id
  WHERE s.id = song_recordings.song_id AND bm.user_id = (select auth.uid()) AND bm.role = 'admin'
));


-- ============================================================
-- song_comments
-- ============================================================

DROP POLICY IF EXISTS "Band members can view song comments" ON song_comments;
CREATE POLICY "Band members can view song comments" ON song_comments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM songs s
  JOIN band_members bm ON bm.band_id = s.band_id
  WHERE s.id = song_comments.song_id AND bm.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "Band members can add song comments" ON song_comments;
CREATE POLICY "Band members can add song comments" ON song_comments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM songs s
  JOIN band_members bm ON bm.band_id = s.band_id
  WHERE s.id = song_comments.song_id AND bm.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "Users can delete own comments or admins can delete any" ON song_comments;
CREATE POLICY "Users can delete own comments or admins can delete any" ON song_comments FOR DELETE
USING ((user_id = (select auth.uid())) OR (EXISTS (
  SELECT 1 FROM songs s
  JOIN band_members bm ON bm.band_id = s.band_id
  WHERE s.id = song_comments.song_id AND bm.user_id = (select auth.uid()) AND bm.role = 'admin'
)));


-- ============================================================
-- member_availability_dates
-- ============================================================

DROP POLICY IF EXISTS "Members can insert own availability" ON member_availability_dates;
CREATE POLICY "Members can insert own availability" ON member_availability_dates FOR INSERT
WITH CHECK ((select auth.uid()) = profile_id);

DROP POLICY IF EXISTS "Members can delete own availability" ON member_availability_dates;
CREATE POLICY "Members can delete own availability" ON member_availability_dates FOR DELETE
USING ((select auth.uid()) = profile_id);

DROP POLICY IF EXISTS "Band members can view member availability" ON member_availability_dates;
CREATE POLICY "Band members can view member availability" ON member_availability_dates FOR SELECT
USING (EXISTS (
  SELECT 1 FROM band_members me
  JOIN band_members them ON me.band_id = them.band_id
  WHERE me.user_id = (select auth.uid()) AND them.user_id = member_availability_dates.profile_id
));


-- ============================================================
-- push_tokens
-- ============================================================

DROP POLICY IF EXISTS "Users can view own push tokens" ON push_tokens;
CREATE POLICY "Users can view own push tokens" ON push_tokens FOR SELECT
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own push tokens" ON push_tokens;
CREATE POLICY "Users can insert own push tokens" ON push_tokens FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own push tokens" ON push_tokens;
CREATE POLICY "Users can update own push tokens" ON push_tokens FOR UPDATE
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own push tokens" ON push_tokens;
CREATE POLICY "Users can delete own push tokens" ON push_tokens FOR DELETE
USING ((select auth.uid()) = user_id);


-- ============================================================
-- notification_log
-- ============================================================

DROP POLICY IF EXISTS "Users can view own notification logs" ON notification_log;
CREATE POLICY "Users can view own notification logs" ON notification_log FOR SELECT
USING ((select auth.uid()) = recipient_user_id);


-- ============================================================
-- gig_proposals
-- ============================================================

DROP POLICY IF EXISTS "Admins can create gig proposals" ON gig_proposals;
CREATE POLICY "Admins can create gig proposals" ON gig_proposals FOR INSERT
WITH CHECK ((created_by = (select auth.uid())) AND is_band_admin(band_id));


-- ============================================================
-- gig_proposal_options
-- ============================================================

DROP POLICY IF EXISTS "Admins can create gig proposal options" ON gig_proposal_options;
CREATE POLICY "Admins can create gig proposal options" ON gig_proposal_options FOR INSERT
WITH CHECK ((created_by = (select auth.uid())) AND (EXISTS (
  SELECT 1 FROM gig_proposals gp
  WHERE gp.id = gig_proposal_options.proposal_id AND is_band_admin(gp.band_id)
)));


-- ============================================================
-- gig_proposal_votes
-- ============================================================

DROP POLICY IF EXISTS "Members can create gig proposal votes" ON gig_proposal_votes;
CREATE POLICY "Members can create gig proposal votes" ON gig_proposal_votes FOR INSERT
WITH CHECK ((user_id = (select auth.uid())) AND (EXISTS (
  SELECT 1 FROM gig_proposals gp
  WHERE gp.id = gig_proposal_votes.proposal_id AND is_band_member(gp.band_id)
)));

DROP POLICY IF EXISTS "Members can update their gig proposal votes" ON gig_proposal_votes;
CREATE POLICY "Members can update their gig proposal votes" ON gig_proposal_votes FOR UPDATE
USING ((user_id = (select auth.uid())) AND (EXISTS (
  SELECT 1 FROM gig_proposals gp
  WHERE gp.id = gig_proposal_votes.proposal_id AND is_band_member(gp.band_id)
)))
WITH CHECK ((user_id = (select auth.uid())) AND (EXISTS (
  SELECT 1 FROM gig_proposals gp
  WHERE gp.id = gig_proposal_votes.proposal_id AND is_band_member(gp.band_id)
)));


-- ============================================================
-- band_contact_messages
-- ============================================================

DROP POLICY IF EXISTS "Band members can read their contact messages" ON band_contact_messages;
CREATE POLICY "Band members can read their contact messages" ON band_contact_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM band_members bm
  WHERE bm.band_id = band_contact_messages.band_id AND bm.user_id = (select auth.uid())
));


-- ============================================================
-- band_streaming_links
-- ============================================================

DROP POLICY IF EXISTS "Band members can manage streaming links" ON band_streaming_links;
CREATE POLICY "Band members can manage streaming links" ON band_streaming_links FOR ALL
USING (EXISTS (
  SELECT 1 FROM band_members
  WHERE band_members.band_id = band_streaming_links.band_id AND band_members.user_id = (select auth.uid()) AND band_members.status = 'active'
));


-- ============================================================
-- band_fans
-- ============================================================

DROP POLICY IF EXISTS "Band members can view their fans" ON band_fans;
CREATE POLICY "Band members can view their fans" ON band_fans FOR SELECT
USING (EXISTS (
  SELECT 1 FROM band_members
  WHERE band_members.band_id = band_fans.band_id AND band_members.user_id = (select auth.uid()) AND band_members.status = 'active'
));


-- ============================================================
-- band_rosters
-- ============================================================

DROP POLICY IF EXISTS "Band members can view rosters" ON band_rosters;
CREATE POLICY "Band members can view rosters" ON band_rosters FOR SELECT
USING (EXISTS (
  SELECT 1 FROM band_members
  WHERE band_members.band_id = band_rosters.band_id AND band_members.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "Band admins can create rosters" ON band_rosters;
CREATE POLICY "Band admins can create rosters" ON band_rosters FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM band_members
  WHERE band_members.band_id = band_rosters.band_id AND band_members.user_id = (select auth.uid()) AND band_members.role = 'admin'
));

DROP POLICY IF EXISTS "Band admins can update rosters" ON band_rosters;
CREATE POLICY "Band admins can update rosters" ON band_rosters FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM band_members
  WHERE band_members.band_id = band_rosters.band_id AND band_members.user_id = (select auth.uid()) AND band_members.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM band_members
  WHERE band_members.band_id = band_rosters.band_id AND band_members.user_id = (select auth.uid()) AND band_members.role = 'admin'
));

DROP POLICY IF EXISTS "Band admins can delete rosters" ON band_rosters;
CREATE POLICY "Band admins can delete rosters" ON band_rosters FOR DELETE
USING (EXISTS (
  SELECT 1 FROM band_members
  WHERE band_members.band_id = band_rosters.band_id AND band_members.user_id = (select auth.uid()) AND band_members.role = 'admin'
));


-- ============================================================
-- band_roster_members
-- ============================================================

DROP POLICY IF EXISTS "Band members can view roster members" ON band_roster_members;
CREATE POLICY "Band members can view roster members" ON band_roster_members FOR SELECT
USING (EXISTS (
  SELECT 1 FROM band_rosters br
  JOIN band_members bm ON bm.band_id = br.band_id
  WHERE br.id = band_roster_members.roster_id AND bm.user_id = (select auth.uid())
));

DROP POLICY IF EXISTS "Band admins can insert roster members" ON band_roster_members;
CREATE POLICY "Band admins can insert roster members" ON band_roster_members FOR INSERT
WITH CHECK ((EXISTS (
  SELECT 1 FROM band_rosters br
  JOIN band_members bm_admin ON bm_admin.band_id = br.band_id
  WHERE br.id = band_roster_members.roster_id AND bm_admin.user_id = (select auth.uid()) AND bm_admin.role = 'admin'
)) AND (EXISTS (
  SELECT 1 FROM band_rosters br2
  JOIN band_members bm_target ON bm_target.band_id = br2.band_id
  WHERE br2.id = band_roster_members.roster_id AND bm_target.user_id = band_roster_members.user_id
)));

DROP POLICY IF EXISTS "Band admins can delete roster members" ON band_roster_members;
CREATE POLICY "Band admins can delete roster members" ON band_roster_members FOR DELETE
USING (EXISTS (
  SELECT 1 FROM band_rosters br
  JOIN band_members bm ON bm.band_id = br.band_id
  WHERE br.id = band_roster_members.roster_id AND bm.user_id = (select auth.uid()) AND bm.role = 'admin'
));


-- ============================================================
-- app_feedback
-- ============================================================

DROP POLICY IF EXISTS "Users can submit feedback" ON app_feedback;
CREATE POLICY "Users can submit feedback" ON app_feedback FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own feedback" ON app_feedback;
CREATE POLICY "Users can view own feedback" ON app_feedback FOR SELECT
USING ((select auth.uid()) = user_id);


-- ============================================================
-- storage.objects (profile-avatars)
-- ============================================================

DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars" ON storage.objects FOR INSERT
WITH CHECK ((bucket_id = 'profile-avatars') AND (name ~~ concat('avatars/', (select auth.uid())::text, '/%')));

DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars" ON storage.objects FOR UPDATE
USING ((bucket_id = 'profile-avatars') AND (name ~~ concat('avatars/', (select auth.uid())::text, '/%')))
WITH CHECK ((bucket_id = 'profile-avatars') AND (name ~~ concat('avatars/', (select auth.uid())::text, '/%')));

DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars" ON storage.objects FOR DELETE
USING ((bucket_id = 'profile-avatars') AND (name ~~ concat('avatars/', (select auth.uid())::text, '/%')));


-- ============================================================
-- storage.objects (public-assets)
-- ============================================================

DROP POLICY IF EXISTS "Owner can update public-assets" ON storage.objects;
CREATE POLICY "Owner can update public-assets" ON storage.objects FOR UPDATE
USING ((bucket_id = 'public-assets') AND (owner = (select auth.uid())))
WITH CHECK ((bucket_id = 'public-assets') AND (owner = (select auth.uid())));

DROP POLICY IF EXISTS "Owner can delete public-assets" ON storage.objects;
CREATE POLICY "Owner can delete public-assets" ON storage.objects FOR DELETE
USING ((bucket_id = 'public-assets') AND (owner = (select auth.uid())));


-- ============================================================
-- storage.objects (band-avatars)
-- ============================================================

DROP POLICY IF EXISTS "band-avatars: admins can write" ON storage.objects;
CREATE POLICY "band-avatars: admins can write" ON storage.objects FOR INSERT
WITH CHECK ((bucket_id = 'band-avatars') AND (split_part(name, '/', 1) = 'avatars') AND (EXISTS (
  SELECT 1 FROM band_members m
  WHERE m.user_id = (select auth.uid()) AND m.role = 'admin' AND m.band_id = (split_part(name, '/', 2))::uuid
)));

DROP POLICY IF EXISTS "band-avatars: admins can update" ON storage.objects;
CREATE POLICY "band-avatars: admins can update" ON storage.objects FOR UPDATE
USING ((bucket_id = 'band-avatars') AND (split_part(name, '/', 1) = 'avatars') AND (EXISTS (
  SELECT 1 FROM band_members m
  WHERE m.user_id = (select auth.uid()) AND m.role = 'admin' AND m.band_id = (split_part(name, '/', 2))::uuid
)))
WITH CHECK ((bucket_id = 'band-avatars') AND (split_part(name, '/', 1) = 'avatars') AND (EXISTS (
  SELECT 1 FROM band_members m
  WHERE m.user_id = (select auth.uid()) AND m.role = 'admin' AND m.band_id = (split_part(name, '/', 2))::uuid
)));

DROP POLICY IF EXISTS "band-avatars: members can read" ON storage.objects;
CREATE POLICY "band-avatars: members can read" ON storage.objects FOR SELECT
USING ((bucket_id = 'band-avatars') AND (split_part(name, '/', 1) = 'avatars') AND (EXISTS (
  SELECT 1 FROM band_members m
  WHERE m.user_id = (select auth.uid()) AND m.band_id = (split_part(name, '/', 2))::uuid
)));


-- ============================================================
-- storage.objects (event-files)
-- ============================================================

DROP POLICY IF EXISTS "Band members can download event files" ON storage.objects;
CREATE POLICY "Band members can download event files" ON storage.objects FOR SELECT
USING ((bucket_id = 'event-files') AND (EXISTS (
  SELECT 1 FROM event_files ef
  JOIN band_members bm ON bm.band_id = ef.band_id
  WHERE ef.file_path = name AND bm.user_id = (select auth.uid())
)));

DROP POLICY IF EXISTS "Admins can upload to event-files bucket" ON storage.objects;
CREATE POLICY "Admins can upload to event-files bucket" ON storage.objects FOR INSERT
WITH CHECK ((bucket_id = 'event-files') AND (EXISTS (
  SELECT 1 FROM events e
  JOIN band_members bm ON bm.band_id = e.band_id
  WHERE (storage.foldername(name))[1] = e.id::text AND bm.user_id = (select auth.uid()) AND bm.role = 'admin'
)));

DROP POLICY IF EXISTS "Admins can delete from event-files bucket" ON storage.objects;
CREATE POLICY "Admins can delete from event-files bucket" ON storage.objects FOR DELETE
USING ((bucket_id = 'event-files') AND (EXISTS (
  SELECT 1 FROM event_files ef
  JOIN band_members bm ON bm.band_id = ef.band_id
  WHERE ef.file_path = name AND bm.user_id = (select auth.uid()) AND bm.role = 'admin'
)));
