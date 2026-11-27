import {
  Activity,
  BarChart3,
  BookOpen,
  Bookmark,
  Box,
  ClipboardCheck,
  Compass,
  CreditCard,
  Database,
  FileText,
  Film,
  Flame,
  GitBranch,
  GraduationCap,
  HelpCircle,
  Home,
  Info,
  Layers,
  LayoutGrid,
  Mail,
  Microscope,
  Search,
  Shield,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import type { ToolIconKey } from '../navigation-registry';

export default function ToolIcon({ name, size = 16 }: { name: ToolIconKey; size?: number }) {
  switch (name) {
    case 'home':
      return <Home size={size} aria-hidden="true" />;
    case 'box':
      return <Box size={size} aria-hidden="true" />;
    case 'book':
      return <BookOpen size={size} aria-hidden="true" />;
    case 'compass':
      return <Compass size={size} aria-hidden="true" />;
    case 'layers':
      return <Layers size={size} aria-hidden="true" />;
    case 'git-branch':
      return <GitBranch size={size} aria-hidden="true" />;
    case 'activity':
      return <Activity size={size} aria-hidden="true" />;
    case 'microscope':
      return <Microscope size={size} aria-hidden="true" />;
    case 'stethoscope':
      return <Stethoscope size={size} aria-hidden="true" />;
    case 'help-circle':
      return <HelpCircle size={size} aria-hidden="true" />;
    case 'clipboard-check':
      return <ClipboardCheck size={size} aria-hidden="true" />;
    case 'flame':
      return <Flame size={size} aria-hidden="true" />;
    case 'bookmark':
      return <Bookmark size={size} aria-hidden="true" />;
    case 'bar-chart':
      return <BarChart3 size={size} aria-hidden="true" />;
    case 'graduation-cap':
      return <GraduationCap size={size} aria-hidden="true" />;
    case 'film':
      return <Film size={size} aria-hidden="true" />;
    case 'database':
      return <Database size={size} aria-hidden="true" />;
    case 'search':
      return <Search size={size} aria-hidden="true" />;
    case 'grid':
      return <LayoutGrid size={size} aria-hidden="true" />;
    case 'credit-card':
      return <CreditCard size={size} aria-hidden="true" />;
    case 'file-text':
      return <FileText size={size} aria-hidden="true" />;
    case 'shield':
      return <Shield size={size} aria-hidden="true" />;
    case 'mail':
      return <Mail size={size} aria-hidden="true" />;
    case 'sparkles':
      return <Sparkles size={size} aria-hidden="true" />;
    case 'info':
    default:
      return <Info size={size} aria-hidden="true" />;
  }
}
