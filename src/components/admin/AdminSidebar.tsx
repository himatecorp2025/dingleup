import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Mail,
  AlertTriangle,
  Gamepad2,
  Target,
  Database,
  TrendingUp,
  Languages,
  Heart,
  Zap,
  ShoppingBag,
  BarChart3,
  Calendar,
  Settings,
  ChevronRight,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useI18n } from '@/i18n';

export function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const { t } = useI18n();
  
  const isCollapsed = state === 'collapsed';

  // Helper to check if path is active
  const isActive = (path: string) => {
    if (path.includes('?')) {
      const [basePath, query] = path.split('?');
      return location.pathname === basePath && location.search.includes(query);
    }
    return location.pathname === path;
  };

  // Check if any analytics route is active
  const isAnalyticsActive = () => {
    return [
      '/admin/advanced-analytics',
      '/admin/retention',
      '/admin/monetization',
      '/admin/performance',
      '/admin/engagement',
      '/admin/user-journey',
    ].some(path => location.pathname === path);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#0f0a1f] backdrop-blur-xl border-r border-white/10">
        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-lg opacity-30"></div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 1024 1024"
              className="w-12 h-12 relative z-10"
            >
              <image
                href="/logo.png"
                x="0"
                y="0"
                width="1024"
                height="1024"
                preserveAspectRatio="xMidYMid meet"
              />
            </svg>
          </div>
          {!isCollapsed && (
            <h2 className="text-white font-bold text-xs mt-2">{t('admin.layout.admin_panel')}</h2>
          )}
        </div>

        {/* DASHBOARD & USERS */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/50 text-xs font-bold uppercase tracking-wider">
            {!isCollapsed && 'Dashboard & Users'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/admin/dashboard')}
                  isActive={isActive('/admin/dashboard') && !location.search}
                  className={isActive('/admin/dashboard') && !location.search ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white' : 'text-white/60'}
                >
                  <LayoutDashboard className="text-purple-400" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/admin/dashboard?tab=users')}
                  isActive={isActive('/admin/dashboard?tab=users')}
                  className={isActive('/admin/dashboard?tab=users') ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white' : 'text-white/60'}
                >
                  <Users className="text-purple-400" />
                  <span>Users</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/admin/dashboard?tab=invitations')}
                  isActive={isActive('/admin/dashboard?tab=invitations')}
                  className={isActive('/admin/dashboard?tab=invitations') ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white' : 'text-white/60'}
                >
                  <Mail className="text-purple-400" />
                  <span>Invitations</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/admin/dashboard?tab=reports')}
                  isActive={isActive('/admin/dashboard?tab=reports')}
                  className={isActive('/admin/dashboard?tab=reports') ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white' : 'text-white/60'}
                >
                  <AlertTriangle className="text-purple-400" />
                  <span>Reports</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* PLAYER & TARGETING */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/50 text-xs font-bold uppercase tracking-wider">
            {!isCollapsed && 'Player & Targeting'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/admin/game-profiles')}
                  isActive={isActive('/admin/game-profiles')}
                  className={isActive('/admin/game-profiles') ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white' : 'text-white/60'}
                >
                  <Gamepad2 className="text-purple-400" />
                  <span>Game Profiles</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/admin/ad-interests')}
                  isActive={isActive('/admin/ad-interests')}
                  className={isActive('/admin/ad-interests') ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white' : 'text-white/60'}
                >
                  <Target className="text-purple-400" />
                  <span>Ad Interests</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* CONTENT CENTER */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/50 text-xs font-bold uppercase tracking-wider">
            {!isCollapsed && 'Content Center'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/admin/question-pools')}
                  isActive={isActive('/admin/question-pools')}
                  className={isActive('/admin/question-pools') ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white' : 'text-white/60'}
                >
                  <Database className="text-purple-400" />
                  <span>Question Pools</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/admin/popular-content')}
                  isActive={isActive('/admin/popular-content')}
                  className={isActive('/admin/popular-content') ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white' : 'text-white/60'}
                >
                  <TrendingUp className="text-purple-400" />
                  <span>Popular Content</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/admin/translations')}
                  isActive={isActive('/admin/translations')}
                  className={isActive('/admin/translations') ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white' : 'text-white/60'}
                >
                  <Languages className="text-purple-400" />
                  <span>Translations</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ECONOMY CENTER */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/50 text-xs font-bold uppercase tracking-wider">
            {!isCollapsed && 'Economy Center'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/admin/lootbox-analytics')}
                  isActive={isActive('/admin/lootbox-analytics')}
                  className={isActive('/admin/lootbox-analytics') ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white' : 'text-white/60'}
                >
                  <Heart className="text-purple-400" />
                  <span>Lootbox Analytics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/admin/booster-types')}
                  isActive={isActive('/admin/booster-types')}
                  className={isActive('/admin/booster-types') ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white' : 'text-white/60'}
                >
                  <Zap className="text-purple-400" />
                  <span>Booster Types</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/admin/booster-purchases')}
                  isActive={isActive('/admin/booster-purchases')}
                  className={isActive('/admin/booster-purchases') ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white' : 'text-white/60'}
                >
                  <ShoppingBag className="text-purple-400" />
                  <span>Booster Purchases</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ADVANCED ANALYTICS HUB with submenu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/50 text-xs font-bold uppercase tracking-wider">
            {!isCollapsed && 'Advanced Analytics Hub'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/admin/advanced-analytics')}
                  isActive={isActive('/admin/advanced-analytics')}
                  className={isActive('/admin/advanced-analytics') ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white' : 'text-white/60'}
                >
                  <BarChart3 className="text-purple-400" />
                  <span>Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {/* Submenu always visible when any analytics page is active */}
              <Collapsible open={isAnalyticsActive()} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          onClick={() => navigate('/admin/retention')}
                          isActive={isActive('/admin/retention')}
                          className={isActive('/admin/retention') ? 'bg-white/10 text-white' : 'text-white/60'}
                        >
                          <span>Retention</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          onClick={() => navigate('/admin/monetization')}
                          isActive={isActive('/admin/monetization')}
                          className={isActive('/admin/monetization') ? 'bg-white/10 text-white' : 'text-white/60'}
                        >
                          <span>Monetization</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          onClick={() => navigate('/admin/performance')}
                          isActive={isActive('/admin/performance')}
                          className={isActive('/admin/performance') ? 'bg-white/10 text-white' : 'text-white/60'}
                        >
                          <span>Performance</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          onClick={() => navigate('/admin/engagement')}
                          isActive={isActive('/admin/engagement')}
                          className={isActive('/admin/engagement') ? 'bg-white/10 text-white' : 'text-white/60'}
                        >
                          <span>Engagement</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          onClick={() => navigate('/admin/user-journey')}
                          isActive={isActive('/admin/user-journey')}
                          className={isActive('/admin/user-journey') ? 'bg-white/10 text-white' : 'text-white/60'}
                        >
                          <span>User Journey</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* OTHER */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/50 text-xs font-bold uppercase tracking-wider">
            {!isCollapsed && 'Other'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/admin/age-statistics')}
                  isActive={isActive('/admin/age-statistics')}
                  className={isActive('/admin/age-statistics') ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white' : 'text-white/60'}
                >
                  <Calendar className="text-purple-400" />
                  <span>Age Statistics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/admin/profile')}
                  isActive={isActive('/admin/profile')}
                  className={isActive('/admin/profile') ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white' : 'text-white/60'}
                >
                  <Settings className="text-purple-400" />
                  <span>Admin Profile</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
