
import React from 'react';
import { MapPin, Route, Clock, Star, Settings, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const menuItems = [
    { icon: MapPin, label: 'Địa điểm của bạn', color: 'text-blue-600' },
    { icon: Route, label: 'Chỉ đường', color: 'text-green-600' },
    { icon: Clock, label: 'Lịch sử', color: 'text-orange-600' },
    { icon: Star, label: 'Đã lưu', color: 'text-yellow-600' },
  ];

  const settingsItems = [
    { icon: Settings, label: 'Cài đặt' },
    { icon: Info, label: 'Về ứng dụng' },
  ];

  if (!isOpen) return null;

  return (
    <div className="absolute top-20 left-4 z-20 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu</h2>
        
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start gap-3 py-3 px-3 hover:bg-gray-50"
            >
              <item.icon className={`h-5 w-5 ${item.color}`} />
              <span className="text-gray-700">{item.label}</span>
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          {settingsItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start gap-3 py-3 px-3 hover:bg-gray-50"
            >
              <item.icon className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
