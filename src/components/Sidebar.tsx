
import React from 'react';
import { MapPin, Route, Clock, Star, Settings, Info, Home, BookOpen, Code, FileText, DollarSign, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const mainMenuItems = [
    { icon: Home, label: 'Trang chủ', url: 'https://maps.vietmap.vn/web', color: 'text-blue-600' },
    { icon: BookOpen, label: 'Tài liệu tích hợp', url: 'https://maps.vietmap.vn/docs/', color: 'text-green-600' },
    { icon: Code, label: 'API Playground', url: 'https://maps.vietmap.vn/playground/', color: 'text-purple-600' },
    { icon: FileText, label: 'Blog', url: 'https://maps.vietmap.vn/web/blog', color: 'text-orange-600' },
    { icon: DollarSign, label: 'Bảng giá', url: 'https://maps.vietmap.vn/web#pricingSection', color: 'text-yellow-600' },
  ];

  const accountItems = [
    { icon: LogIn, label: 'Đăng nhập', url: 'https://maps.vietmap.vn/console/' },
    { icon: Info, label: 'Trợ giúp & phản hồi', url: 'https://maps.vietmap.vn/web#contact-section' },
  ];

  if (!isOpen) return null;

  return (
    <div className="absolute top-20 left-6 z-30 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="p-4">
        <div className="space-y-1">
          {mainMenuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start gap-4 py-3 px-3 hover:bg-gray-50 text-left h-auto"
              asChild
            >
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <item.icon className={`h-5 w-5 ${item.color} flex-shrink-0`} />
                <span className="text-gray-800 text-sm">{item.label}</span>
              </a>
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          {accountItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start gap-4 py-3 px-3 hover:bg-gray-50 text-left h-auto"
              asChild
            >
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <item.icon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                <span className="text-gray-800 text-sm">{item.label}</span>
              </a>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
