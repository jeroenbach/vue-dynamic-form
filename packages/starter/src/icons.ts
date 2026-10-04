import {
  Briefcase,
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Eye,
  EyeOff,
  LayoutGrid,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Rocket,
  Shield,
  Sparkles,
  Trash2,
  Users,
  Zap,
} from '@lucide/vue';

/**
 * Bounded name-to-component map. Static imports keep the bundle to exactly
 * these icons; resolving arbitrary strings against the full Lucide catalogue
 * would defeat tree-shaking.
 */
export const registry = {
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  check: Check,
  trash: Trash2,
  plus: Plus,
  zap: Zap,
  users: Users,
  grid: LayoutGrid,
  pencil: Pencil,
  checkCircle: CircleCheck,
  loader: LoaderCircle,
  refreshCw: RefreshCw,
  eye: Eye,
  eyeOff: EyeOff,
  building2: Building2,
  rocket: Rocket,
  calendar: Calendar,
  briefcase: Briefcase,
  shield: Shield,
  sparkles: Sparkles,
} as const;

export type StarterIconName = keyof typeof registry;

export const starterIconNames = Object.keys(registry) as StarterIconName[];
