import React, { useState } from 'react';
import { migrateTemplatesToRichText } from '../utils/richTextMigration';

interface RichTextMigrationNoticeProps {
  onMigrationComplete: () => void;
}

const RichTextMigrationNotice: React.FC<RichTextMigrationNoticeProps> = ({ onMigrationComplete }) => {
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ migrated: number; total: number } | null>(null);

  const handleMigration = async () => {
    setMigrating(true);
    setError(null);
    
    try {
      const migrationResults = await migrateTemplatesToRichText();
      setResults(migrationResults);
      
      // If successful, notify the parent component
      if (migrationResults.migrated > 0) {
        setTimeout(() => onMigrationComplete(), 2000); // Wait 2 seconds to show results
      } else {
        // No templates needed migration
        onMigrationComplete();
      }
    } catch (err) {
      setError((err as Error).message || 'Migration failed');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-blue-800 mb-3">Rich Text Templates Update</h2>
      
      <p className="mb-4 text-blue-700">
        We've updated the template system to exclusively use rich text formatting for all templates.
        This will provide better formatting options and improved compatibility with email clients.
      </p>
      
      <p className="mb-4 text-blue-700">
        Your existing plain text templates need to be migrated to rich text format.
        This will convert line breaks to paragraphs and preserve your template content.
      </p>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {results && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Migration complete! {results.migrated} of {results.total} templates were updated to rich text format.
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          onClick={handleMigration}
          disabled={migrating}
        >
          {migrating ? 'Migrating...' : 'Migrate Templates to Rich Text'}
        </button>
      </div>
    </div>
  );
};

export default RichTextMigrationNotice;