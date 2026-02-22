'use client';

import RecallActionsPanel from '@/components/RecallActionsPanel';
import type { CaseJson } from '@/lib/case-types';

interface CaseActionsClientProps {
  case_json: CaseJson;
}

export default function CaseActionsClient({ case_json }: CaseActionsClientProps) {
  return (
    <RecallActionsPanel
      case_json={case_json}
      onApproveSuccess={() => {
        // Page will reflect updated state on next navigation/reload
      }}
    />
  );
}
