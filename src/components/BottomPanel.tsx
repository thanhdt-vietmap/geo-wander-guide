
import React, { useState } from 'react';
import { ChevronUp, ChevronDown, MapPin, Clock, Phone, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BottomPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const placeInfo = {
    name: "Hồ Gươm (Hồ Hoàn Kiếm)",
    address: "Hoàn Kiếm, Hà Nội, Việt Nam",
    rating: 4.5,
    reviews: 2840,
    status: "Mở cửa",
    phone: "+84 24 3825 4554",
    website: "hanoi.gov.vn"
  };

  return (
    <div className={`absolute bottom-0 left-0 right-0 z-10 bg-white shadow-2xl transition-all duration-300 ${
      isExpanded ? 'h-80' : 'h-24'
    }`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 truncate">{placeInfo.name}</h3>
              <p className="text-sm text-gray-600 truncate">{placeInfo.address}</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg ${i < Math.floor(placeInfo.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {placeInfo.rating} ({placeInfo.reviews.toLocaleString()} đánh giá)
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">{placeInfo.status}</span>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{placeInfo.phone}</span>
              </div>

              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-blue-600">{placeInfo.website}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="default" className="flex-1">
                Chỉ đường
              </Button>
              <Button variant="outline" className="flex-1">
                Lưu
              </Button>
              <Button variant="outline" className="flex-1">
                Chia sẻ
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomPanel;
