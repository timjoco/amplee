{
  isAdmin && (
    <div style={{ marginTop: 16 }}>
      {!adding ? (
        <IonButton
          expand="block"
          fill="outline"
          onClick={() => setAdding(true)}
          disabled={saving}
          style={{
            '--background': 'rgba(15,23,42,0.98)',
            '--border-color': 'rgba(45,212,191,0.8)',
            '--color': 'rgba(45,212,191,0.95)',
            '--background-activated': 'rgba(27, 124, 111, 1)',
            borderRadius: 999,
            boxShadow:
              '0 0 0 1px rgba(15,23,42,0.9), 0 8px 22px rgba(0,0,0,0.9)',
          }}
        >
          <IonIcon icon={addCircleOutline} slot="start" />
          Add date option
        </IonButton>
      ) : (
        <div
          style={{
            borderRadius: 14,
            padding: '12px 12px 14px 12px',
            marginTop: 4,
            border: '1px solid rgba(148,163,184,0.6)',
            background:
              'linear-gradient(180deg, rgba(15,23,42,0.97), rgba(3,7,18,0.97))',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            overflow: 'hidden', // ✅ prevent any child overflow on the right
          }}
        >
          <IonText>
            <p
              style={{
                margin: 0,
                fontWeight: 600,
                color: '#E5E7EB',
              }}
            >
              Add a date option
            </p>
          </IonText>

          <input
            type="datetime-local"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '100%', // ✅ never exceed parent width
              display: 'block', // ✅ no inline weirdness
              boxSizing: 'border-box',
              borderRadius: 10,
              border: '1px solid rgba(148,163,184,0.8)',
              padding: '10px 12px',
              backgroundColor: '#020617',
              color: '#E5E7EB',
              fontSize: 14,
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 8,
              marginTop: 4,
            }}
          >
            <IonButton
              size="small"
              expand="block"
              onClick={addOption}
              disabled={!newDate || saving}
              style={{
                '--background': 'rgba(45,212,191,0.95)',
                '--background-activated': 'rgba(45,212,191,1)',
                '--background-hover': 'rgba(45,212,191,1)',
                '--color': '#022c22',
                borderRadius: 999,
                boxShadow: '0 0 18px rgba(45,212,191,0.45)',
              }}
            >
              Save
            </IonButton>

            <IonButton
              size="small"
              expand="block"
              fill="outline"
              color="medium"
              onClick={() => {
                setAdding(false);
                setNewDate('');
              }}
              style={{
                borderRadius: 999,
              }}
            >
              Cancel
            </IonButton>
          </div>
        </div>
      )}
    </div>
  );
}
