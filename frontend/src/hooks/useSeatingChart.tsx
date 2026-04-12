'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlanningHydration } from '@/hooks/PlanningHydrationContext';
import type { Guest as UserGuest } from '@/hooks/useUserData';
import { useUserData } from '@/hooks/useUserData';
import { loadUserJsonObject, saveUserJsonObject, PLANNING_PARTS } from '@/lib/userPlanningStorage';

export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
  rsvpStatus: 'pending' | 'attending' | 'declined';
  dietaryNeeds?: string;
  plusOne: boolean;
  plusOneName?: string;
  tableId?: string;
  seatNumber?: number;
  specialRequirements?: string;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  x: number;
  y: number;
  shape: 'round' | 'rectangle' | 'square';
  guests: Guest[];
  specialNotes?: string;
}

export interface SeatingChart {
  id: string;
  name: string;
  venue: string;
  totalGuests: number;
  totalTables: number;
  tables: Table[];
  createdAt: string;
  lastModified: string;
  notes?: string;
}

interface UseSeatingChartReturn {
  seatingChart: SeatingChart | null;
  createSeatingChart: (name: string, venue: string) => Promise<void>;
  updateSeatingChart: (updates: Partial<SeatingChart>) => Promise<void>;
  addTable: (table: Omit<Table, 'id' | 'guests'>) => Promise<void>;
  updateTable: (tableId: string, updates: Partial<Table>) => Promise<void>;
  deleteTable: (tableId: string) => Promise<void>;
  moveTable: (tableId: string, x: number, y: number) => Promise<void>;
  duplicateTable: (tableId: string) => Promise<void>;
  renameTable: (tableId: string, newName: string) => Promise<void>;
  assignGuestToTable: (guestId: string, tableId: string, seatNumber?: number) => Promise<void>;
  unassignGuestFromTable: (guestId: string) => Promise<void>;
  moveGuestBetweenTables: (
    guestId: string,
    fromTableId: string,
    toTableId: string,
    seatNumber?: number,
  ) => Promise<void>;
  availableGuests: Guest[];
  getGuestsByTable: (tableId: string) => Guest[];
  getUnassignedGuests: () => Guest[];
  getSeatingStatistics: () => {
    totalGuests: number;
    assignedGuests: number;
    unassignedGuests: number;
    totalTables: number;
    averageGuestsPerTable: number;
    tableUtilization: { [tableId: string]: number };
  };
  exportSeatingChart: () => void;
  isLoading: boolean;
  error: string | null;
}

function mapUserGuestToSeating(g: UserGuest): Guest {
  return {
    id: g.id,
    name: g.name,
    email: g.email,
    phone: g.phone,
    relationship: g.relationship,
    rsvpStatus: g.rsvpStatus,
    dietaryNeeds: g.dietaryNeeds,
    plusOne: g.plusOne,
    plusOneName: g.plusOneName,
    tableId: undefined,
    seatNumber: undefined,
  };
}

function mergeUserGuestWithChart(ug: UserGuest, chart: SeatingChart | null): Guest {
  const base = mapUserGuestToSeating(ug);
  if (!chart) return base;
  for (const t of chart.tables) {
    const onTable = t.guests.find((g) => g.id === ug.id);
    if (onTable) {
      return {
        ...base,
        ...onTable,
        tableId: t.id,
        name: ug.name,
        email: ug.email ?? onTable.email,
        phone: ug.phone ?? onTable.phone,
        relationship: ug.relationship,
        rsvpStatus: ug.rsvpStatus,
        dietaryNeeds: ug.dietaryNeeds ?? onTable.dietaryNeeds,
        plusOne: ug.plusOne,
        plusOneName: ug.plusOneName ?? onTable.plusOneName,
      };
    }
  }
  return base;
}

function normalizeChart(chart: SeatingChart): SeatingChart {
  return { ...chart, totalTables: chart.tables.length };
}

function isValidLoadedChart(raw: unknown): raw is SeatingChart {
  return Boolean(raw && typeof raw === 'object' && Array.isArray((raw as SeatingChart).tables));
}

function deferSetError(set: (msg: string | null) => void, msg: string | null) {
  queueMicrotask(() => set(msg));
}

export function useSeatingChart(): UseSeatingChartReturn {
  const { user } = useAuth();
  const planningHydration = usePlanningHydration();
  const { guests: userGuests } = useUserData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seatingChart, setSeatingChart] = useState<SeatingChart | null>(null);

  const persistChart = useCallback((uid: string, next: SeatingChart) => {
    try {
      saveUserJsonObject(uid, PLANNING_PARTS.seatingChart, normalizeChart(next));
    } catch {
      deferSetError(setError, 'Could not save seating chart (storage may be full).');
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setSeatingChart(null);
      setIsLoading(false);
      return;
    }
    const uid = String(user.id);
    setIsLoading(true);
    setError(null);
    try {
      const raw = loadUserJsonObject<SeatingChart>(uid, PLANNING_PARTS.seatingChart);
      if (raw && isValidLoadedChart(raw)) {
        setSeatingChart(normalizeChart(raw));
      } else {
        setSeatingChart(null);
      }
    } catch (e) {
      console.error(e);
      setSeatingChart(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, planningHydration]);

  const availableGuests = useMemo((): Guest[] => {
    return userGuests.map((ug) => mergeUserGuestWithChart(ug, seatingChart));
  }, [userGuests, seatingChart]);

  const createSeatingChart = async (name: string, venue: string) => {
    if (!user) return;
    const uid = String(user.id);
    setIsLoading(true);
    setError(null);
    try {
      const attending = userGuests.filter((g) => g.rsvpStatus === 'attending').length;
      const newSeatingChart: SeatingChart = normalizeChart({
        id: `chart_${Date.now()}`,
        name,
        venue,
        totalGuests: attending,
        totalTables: 0,
        tables: [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      });
      setSeatingChart(newSeatingChart);
      persistChart(uid, newSeatingChart);
    } catch (err) {
      setError('Failed to create seating chart');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSeatingChart = async (updates: Partial<SeatingChart>) => {
    if (!seatingChart || !user) return;
    const uid = String(user.id);
    setIsLoading(true);
    try {
      const next = normalizeChart({
        ...seatingChart,
        ...updates,
        lastModified: new Date().toISOString(),
      });
      setSeatingChart(next);
      persistChart(uid, next);
    } catch (err) {
      setError('Failed to update seating chart');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const addTable = async (table: Omit<Table, 'id' | 'guests'>) => {
    if (!seatingChart || !user) return;
    const uid = String(user.id);
    setIsLoading(true);
    try {
      const newTable: Table = {
        ...table,
        id: `table_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        guests: [],
      };
      const next = normalizeChart({
        ...seatingChart,
        tables: [...seatingChart.tables, newTable],
        lastModified: new Date().toISOString(),
      });
      setSeatingChart(next);
      persistChart(uid, next);
    } catch (err) {
      setError('Failed to add table');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTable = async (tableId: string, updates: Partial<Table>) => {
    if (!seatingChart || !user) return;
    const uid = String(user.id);
    setIsLoading(true);
    try {
      const next = normalizeChart({
        ...seatingChart,
        tables: seatingChart.tables.map((table) =>
          table.id === tableId ? { ...table, ...updates } : table,
        ),
        lastModified: new Date().toISOString(),
      });
      setSeatingChart(next);
      persistChart(uid, next);
    } catch (err) {
      setError('Failed to update table');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTable = async (tableId: string) => {
    if (!seatingChart || !user) return;
    const uid = String(user.id);
    setIsLoading(true);
    try {
      const next = normalizeChart({
        ...seatingChart,
        tables: seatingChart.tables.filter((table) => table.id !== tableId),
        lastModified: new Date().toISOString(),
      });
      setSeatingChart(next);
      persistChart(uid, next);
    } catch (err) {
      setError('Failed to delete table');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const duplicateTable = async (tableId: string) => {
    if (!seatingChart || !user) return;
    const uid = String(user.id);
    setIsLoading(true);
    try {
      const originalTable = seatingChart.tables.find((t) => t.id === tableId);
      if (!originalTable) return;
      const newTable: Table = {
        ...originalTable,
        id: `table_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: `${originalTable.name} (Copy)`,
        x: originalTable.x + 50,
        y: originalTable.y + 50,
        guests: [],
      };
      const next = normalizeChart({
        ...seatingChart,
        tables: [...seatingChart.tables, newTable],
        lastModified: new Date().toISOString(),
      });
      setSeatingChart(next);
      persistChart(uid, next);
    } catch (err) {
      setError('Failed to duplicate table');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const renameTable = async (tableId: string, newName: string) => {
    await updateTable(tableId, { name: newName });
  };

  const moveTable = async (tableId: string, x: number, y: number) => {
    if (!user) return;
    const uid = String(user.id);
    setSeatingChart((prev) => {
      if (!prev) return null;
      const next = normalizeChart({
        ...prev,
        tables: prev.tables.map((t) => (t.id === tableId ? { ...t, x, y } : t)),
        lastModified: new Date().toISOString(),
      });
      try {
        saveUserJsonObject(uid, PLANNING_PARTS.seatingChart, next);
      } catch {
        deferSetError(setError, 'Could not save table position.');
        return prev;
      }
      deferSetError(setError, null);
      return next;
    });
  };

  const assignGuestToTable = async (guestId: string, tableId: string, seatNumber?: number) => {
    if (!user) return;
    const uid = String(user.id);
    const ug = userGuests.find((g) => g.id === guestId);
    if (!ug) return;

    setSeatingChart((prev) => {
      if (!prev) return prev;
      const target = prev.tables.find((t) => t.id === tableId);
      if (!target) return prev;

      const withoutGuest = prev.tables.map((t) => ({
        ...t,
        guests: t.guests.filter((g) => g.id !== guestId),
      }));
      const tgt = withoutGuest.find((t) => t.id === tableId);
      if (!tgt) return prev;
      if (tgt.guests.length >= tgt.capacity) {
        deferSetError(setError, 'Table is at full capacity');
        return prev;
      }

      const seatingGuest: Guest = { ...mapUserGuestToSeating(ug), tableId, seatNumber };
      const nextTables = withoutGuest.map((t) =>
        t.id === tableId ? { ...t, guests: [...t.guests, seatingGuest] } : t,
      );
      const next = normalizeChart({
        ...prev,
        tables: nextTables,
        lastModified: new Date().toISOString(),
      });
      try {
        saveUserJsonObject(uid, PLANNING_PARTS.seatingChart, next);
      } catch {
        deferSetError(setError, 'Could not save seating assignment.');
        return prev;
      }
      deferSetError(setError, null);
      return next;
    });
  };

  const unassignGuestFromTable = async (guestId: string) => {
    if (!user) return;
    const uid = String(user.id);
    setSeatingChart((prev) => {
      if (!prev) return prev;
      const next = normalizeChart({
        ...prev,
        tables: prev.tables.map((t) => ({
          ...t,
          guests: t.guests.filter((g) => g.id !== guestId),
        })),
        lastModified: new Date().toISOString(),
      });
      try {
        saveUserJsonObject(uid, PLANNING_PARTS.seatingChart, next);
      } catch {
        deferSetError(setError, 'Could not save seating chart.');
        return prev;
      }
      deferSetError(setError, null);
      return next;
    });
  };

  const moveGuestBetweenTables = async (
    guestId: string,
    _fromTableId: string,
    toTableId: string,
    seatNumber?: number,
  ) => {
    if (!user) return;
    const uid = String(user.id);
    const ug = userGuests.find((g) => g.id === guestId);
    if (!ug) return;

    setSeatingChart((prev) => {
      if (!prev) return prev;
      const withoutGuest = prev.tables.map((t) => ({
        ...t,
        guests: t.guests.filter((g) => g.id !== guestId),
      }));
      const tgt = withoutGuest.find((t) => t.id === toTableId);
      if (!tgt) return prev;
      if (tgt.guests.length >= tgt.capacity) {
        deferSetError(setError, 'Table is at full capacity');
        return prev;
      }
      const seatingGuest: Guest = { ...mapUserGuestToSeating(ug), tableId: toTableId, seatNumber };
      const nextTables = withoutGuest.map((t) =>
        t.id === toTableId ? { ...t, guests: [...t.guests, seatingGuest] } : t,
      );
      const next = normalizeChart({
        ...prev,
        tables: nextTables,
        lastModified: new Date().toISOString(),
      });
      try {
        saveUserJsonObject(uid, PLANNING_PARTS.seatingChart, next);
      } catch {
        deferSetError(setError, 'Could not save seating chart.');
        return prev;
      }
      deferSetError(setError, null);
      return next;
    });
  };

  const getGuestsByTable = (tableId: string) => {
    const table = seatingChart?.tables.find((t) => t.id === tableId);
    return table ? table.guests : [];
  };

  const getUnassignedGuests = () => {
    return availableGuests.filter((guest) => !guest.tableId && guest.rsvpStatus === 'attending');
  };

  const getSeatingStatistics = () => {
    if (!seatingChart) {
      return {
        totalGuests: 0,
        assignedGuests: 0,
        unassignedGuests: 0,
        totalTables: 0,
        averageGuestsPerTable: 0,
        tableUtilization: {} as { [tableId: string]: number },
      };
    }

    const attendingGuests = availableGuests.filter((g) => g.rsvpStatus === 'attending');
    const assignedGuests = attendingGuests.filter((g) => g.tableId);
    const unassignedGuests = attendingGuests.filter((g) => !g.tableId);
    const totalTables = seatingChart.tables.length;

    const tableUtilization: { [tableId: string]: number } = {};
    seatingChart.tables.forEach((table) => {
      tableUtilization[table.id] = (table.guests.length / Math.max(table.capacity, 1)) * 100;
    });

    return {
      totalGuests: attendingGuests.length,
      assignedGuests: assignedGuests.length,
      unassignedGuests: unassignedGuests.length,
      totalTables,
      averageGuestsPerTable: totalTables > 0 ? assignedGuests.length / totalTables : 0,
      tableUtilization,
    };
  };

  const exportSeatingChart = () => {
    if (!seatingChart) return;
    const exportData = {
      chartName: seatingChart.name,
      venue: seatingChart.venue,
      exportedAt: new Date().toISOString(),
      tables: seatingChart.tables.map((table) => ({
        name: table.name,
        capacity: table.capacity,
        guests: table.guests.map((guest) => ({
          name: guest.name,
          plusOne: guest.plusOne ? ` + ${guest.plusOneName}` : '',
          dietaryNeeds: guest.dietaryNeeds || '',
          specialRequirements: guest.specialRequirements || '',
        })),
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seating-chart-${seatingChart.name.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    seatingChart,
    createSeatingChart,
    updateSeatingChart,
    addTable,
    updateTable,
    deleteTable,
    moveTable,
    duplicateTable,
    renameTable,
    assignGuestToTable,
    unassignGuestFromTable,
    moveGuestBetweenTables,
    availableGuests,
    getGuestsByTable,
    getUnassignedGuests,
    getSeatingStatistics,
    exportSeatingChart,
    isLoading,
    error,
  };
}
