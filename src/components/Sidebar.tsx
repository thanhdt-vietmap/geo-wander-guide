
import React from 'react';
import { MapPin, Route, Clock, Star, Settings, Info, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const menuItems = [
    { icon: Home, label: 'Trang chủ', color: 'text-blue-600' },
    { icon: MapPin, label: 'Địa điểm của bạn', color: 'text-red-600' },
    { icon: Route, label: 'Chỉ đường', color: 'text-green-600' },
    { icon: Clock, label: 'Gần đây', color: 'text-orange-600' },
    { icon: Star, label: 'Đã lưu', color: 'text-yellow-600' },
  ];

  const settingsItems = [
    { icon: Settings, label: 'Cài đặt' },
    { icon: Info, label: 'Trợ giúp & phản hồi' },
  ];

  if (!isOpen) return null;

  return (
    <div className="absolute top-20 left-6 z-30 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="p-4">
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start gap-4 py-3 px-3 hover:bg-gray-50 text-left h-auto"
            >
              <item.icon className={`h-5 w-5 ${item.color} flex-shrink-0`} />
              <span className="text-gray-800 text-sm">{item.label}</span>
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          {settingsItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start gap-4 py-3 px-3 hover:bg-gray-50 text-left h-auto"
            >
              <item.icon className="h-5 w-5 text-gray-500 flex-shrink-0" />
              <span className="text-gray-800 text-sm">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
