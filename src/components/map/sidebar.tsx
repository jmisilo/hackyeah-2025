import { Bike, BusFront, Clock, FlagTriangleRight, Pin, Settings2, TramFront } from 'lucide-react';
import { type Dispatch, type FC, type SetStateAction } from 'react';

import { type LatLng } from '@/infrastructure/routing/osrm-client';

import { SearchPanel } from './search-panel';

type SidebarProps = {
  setClickMode: Dispatch<SetStateAction<'start' | 'end' | null>>;
  clickMode: 'start' | 'end' | null;
  handleStartLocationSelect: (location: LatLng, name: string) => void;
  handleEndLocationSelect: (location: LatLng, name: string) => void;
  searchStart: string;
  setSearchStart: Dispatch<SetStateAction<string>>;
  searchEnd: string;
  setSearchEnd: Dispatch<SetStateAction<string>>;
};

export const Sidebar: FC<SidebarProps> = ({
  setClickMode,
  clickMode,
  handleStartLocationSelect,
  handleEndLocationSelect,
  searchStart,
  setSearchStart,
  searchEnd,
  setSearchEnd,
}) => {
  return (
    <aside className="fixed left-4 top-4 h-[calc(100vh-2rem)] w-80 bg-[#F7F7F7]/50 shadow-2xl z-[1001] flex flex-col gap-y-6 rounded-[12px] border border-black/4 backdrop-blur-[50px] p-4">
      <h1 className="text-xl font-medium text-black">Wyszukaj trasę</h1>

      <div className="w-full h-px bg-black/8"></div>

      <div className="flex gap-x-3">
        <div className="flex-1 px-4 py-2.5 border border-black/12 rounded-lg flex items-center justify-center bg-white cursor-pointer">
          <BusFront className="text-2xl text-black" />
        </div>

        <div className="flex-1 px-4 py-2.5 border border-black/12 bg-[#eeeeee] rounded-lg flex items-center justify-center cursor-pointer">
          <TramFront className="text-2xl text-black/30" />
        </div>

        <div className="flex-1 px-4 py-2.5 border border-black/12 bg-[#eeeeee] rounded-lg flex items-center justify-center cursor-pointer">
          <Bike className="text-2xl text-black/30" />
        </div>
      </div>

      <div className="flex flex-col gap-y-3">
        <div className="relative rounded-lg p-2 bg-white flex items-center gap-x-1.5">
          <button
            onClick={() => setClickMode(clickMode === 'start' ? null : 'start')}
            className="p-1 rounded hover:bg-[#eeeeee] transition-colors duration-200">
            <Pin className="size-4 text-[#408333]" />
          </button>

          <SearchPanel
            onLocationSelect={handleStartLocationSelect}
            placeholder="Wyszukaj punkt startowy..."
            value={searchStart}
            onChange={setSearchStart}
          />
        </div>

        <div className="relative rounded-lg p-2 bg-white flex items-center gap-x-1.5">
          <button
            onClick={() => setClickMode(clickMode === 'end' ? null : 'end')}
            className="p-1 rounded hover:bg-[#eeeeee] transition-colors duration-200">
            <FlagTriangleRight className="size-4 text-[#2B87E4]" />
          </button>

          <SearchPanel
            onLocationSelect={handleEndLocationSelect}
            placeholder="Wyszukaj punkt docelowy..."
            value={searchEnd}
            onChange={setSearchEnd}
          />
        </div>

        <div className="relative rounded-lg p-2 bg-white flex items-center gap-x-1.5">
          <button
            onClick={() => setClickMode(clickMode === 'end' ? null : 'end')}
            className="p-1 rounded hover:bg-[#eeeeee] transition-colors duration-200">
            <Clock className="size-4 text-black" />
          </button>

          <input
            type="datetime-local"
            className="w-full text-sm text-black focus:outline-none"
            defaultValue={new Date(new Date().getTime() + 2 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 16)}
          />
        </div>

        <div className="flex justify-between items-center ">
          <div className="flex gap-x-2">
            <div className="flex rounded-full p-0.5 bg-white  ">
              <div className="size-3" />
              <div className="size-3 rounded-full bg-[#FFA633]" />
            </div>

            <p className="text-xs">bez przesiadek</p>
          </div>

          <div className="p-1 rounded hover:bg-[#eeeeee] transition-colors duration-200">
            <Settings2 className="size-4 text-black" />
          </div>
        </div>
      </div>
      {!!searchStart && !!searchEnd && <p className="text-base">Sugerowane trasy</p>}

      <ul className="flex-1 overflow-y-auto -mt-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-black/30 scrollbar-track-rounded-full flex flex-col gap-y-3">
        {!!searchStart &&
          !!searchEnd &&
          PROPOSED_ROUTES.map((route, index) => <SidebarRouteListItem key={index} {...route} />)}
      </ul>

      <div className="rounded-lg p-3 border border-black/12 bg-[#FFF6EB] flex flex-col gap-y-4">
        <div className="flex items-center gap-x-3">
          <div className="size-9 rounded-full bg-orange-300 flex items-center justify-center text-xl text-white ">
            N
          </div>

          <div className="flex flex-col gap-y-0">
            <p className="text-sm">Natalia Brak</p>

            <p className="text-xs text-black/40">natalia.brak@knmstudio.com</p>
          </div>
        </div>

        <div className="flex flex-col gap-y-2">
          <div className="rounded-full w-full flex-none h-1.5  bg-black/12 relative">
            <div className="rounded-full bg-[#FF9000] w-3/5 h-full" />
          </div>

          <p className="text-xs">
            Do nagrody brakuje ci <span className="font-medium">20 punktów</span>!
          </p>
        </div>
      </div>
    </aside>
  );
};

const SidebarRouteListItem: FC<{
  duration: number;
  tillDeparture: number;
  startTime: string;
  startStop: string;
  endStop: string;
  endTime: string;
  lineDirection: string;
  lineNumber: number;
}> = ({
  startTime,
  startStop,
  endStop,
  endTime,
  lineDirection,
  lineNumber,
  duration,
  tillDeparture,
}) => {
  return (
    <li className="group px-3 pt-3 pb-4 rounded-lg bg-white border first:border-[#FF9000] border-black/8 flex flex-col gap-y-6">
      <div className="flex items-center justify-between">
        <p className="flex items-end gap-x-1.5">
          <span className="text-black/40 text-xs leading-4">Odjazd za</span>
          <span className="text-lg font-medium leading-4.5">{tillDeparture} minut</span>
        </p>

        <p className="group-first:block hidden py-0.5 px-2 border border-[#FF9000] text-[#FF9000] rounded-full text-[11px]">
          Polecane
        </p>
      </div>

      <div className="flex flex-col gap-y-1.5">
        <div className="flex items-center gap-x-1">
          <p className="text-sm text-[#15AD12] w-11">{startTime}</p>

          <div className="text-black/40">
            <Pin className="size-3.5" />
          </div>

          <p className="pl-1 text-sm text-black">{startStop}</p>
        </div>

        <div className="flex items-center gap-x-1">
          <div className="w-11 text-xs text-black/30">{duration} min</div>

          <div className="w-3.5 flex items-center justify-center">
            <div className="h-7.5 border-l border-dashed border-black/20" />
          </div>

          <p className="flex gap-x-1 items-center">
            <div className="p-1 h-4 min-w-4 rounded-sm bg-[#FF9000] text-xs text-white flex items-center justify-center">
              {lineNumber}
            </div>

            <span className="text-xs text-nowrap">{lineDirection}</span>
          </p>
        </div>

        <div className="flex items-center gap-x-1">
          <p className="text-sm text-[#15AD12] w-11">{endTime}</p>

          <div className="size-3.5 flex items-center justify-center">
            <div className="size-2 bg-orange-300 rounded-full" />
          </div>

          <p className="pl-1 text-sm text-black">{endStop}</p>
        </div>
      </div>
    </li>
  );
};

const PROPOSED_ROUTES = [
  {
    duration: 25,
    tillDeparture: 5,
    startTime: '12:53',
    startStop: 'Nowy Kleparz',
    endStop: 'Galeria Krakowska',
    endTime: '13:15',
    lineDirection: 'Rondo Mogilskie',
    lineNumber: 3,
  },
  {
    duration: 32,
    tillDeparture: 20,
    startTime: '13:08',
    startStop: 'Plac Inwalidów',
    endStop: 'Galeria Krakowska',
    endTime: '13:40',
    lineDirection: 'Wieliczka Kopalnia',
    lineNumber: 125,
  },
  {
    duration: 25,
    tillDeparture: 55,
    startTime: '13:43',
    startStop: 'Nowy Kleparz',
    endStop: 'Galeria Krakowska',
    endTime: '14:05',
    lineDirection: 'Rondo Mogilskie',
    lineNumber: 3,
  },
];
