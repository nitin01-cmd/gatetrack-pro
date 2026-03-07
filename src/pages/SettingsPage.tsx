import { useAppData } from '@/hooks/useAppData';
import { SUBJECTS } from '@/lib/types';
import { Save, RotateCcw } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const { data, updateSettings, resetData } = useAppData();
  const [settings, setSettings] = useState(data.subjectSettings);

  const handleSave = () => {
    updateSettings(settings);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your preparation targets</p>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Total Lectures per Subject</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {settings.map((s, i) => (
            <div key={s.subject}>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{s.subject}</label>
              <input
                type="number"
                min={1}
                value={s.totalLectures}
                onChange={e => {
                  const updated = [...settings];
                  updated[i] = { ...updated[i], totalLectures: +e.target.value };
                  setSettings(updated);
                }}
                className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          ))}
        </div>
        <button onClick={handleSave} className="mt-4 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-2">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">Reset all data. This cannot be undone.</p>
        <button onClick={() => { if (confirm('Are you sure? This will delete all your data.')) resetData(); }} className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <RotateCcw className="w-4 h-4" /> Reset All Data
        </button>
      </div>
    </div>
  );
}
