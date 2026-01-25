import { useMemo } from 'react';
import type { TourStopWithFinancials } from '../types/tourTypes';

type TourFinancialSummary = {
  totalGuarantee: number;
  totalMerchSales: number;
  totalOtherIncome: number;
  totalIncome: number;
  totalHotelCost: number;
  totalTravelCost: number;
  totalFoodPerDiem: number;
  totalEquipmentRental: number;
  totalParkingTolls: number;
  totalOtherExpenses: number;
  totalExpenses: number;
  netProfit: number;
  settledCount: number;
  unsettledCount: number;
};

export function useTourFinancials(stops: TourStopWithFinancials[]): TourFinancialSummary {
  return useMemo(() => {
    let totalGuarantee = 0;
    let totalMerchSales = 0;
    let totalOtherIncome = 0;
    let totalHotelCost = 0;
    let totalTravelCost = 0;
    let totalFoodPerDiem = 0;
    let totalEquipmentRental = 0;
    let totalParkingTolls = 0;
    let totalOtherExpenses = 0;
    let settledCount = 0;
    let unsettledCount = 0;

    for (const stop of stops) {
      const f = stop.financials;
      if (!f) continue;

      // Income
      totalGuarantee += f.guarantee_amount ?? 0;
      totalMerchSales += f.merch_sales ?? 0;
      totalOtherIncome += f.other_income ?? 0;

      // Expenses
      totalHotelCost += f.hotel_cost ?? 0;
      totalTravelCost += f.travel_cost ?? 0;
      totalFoodPerDiem += f.food_per_diem ?? 0;
      totalEquipmentRental += f.equipment_rental ?? 0;
      totalParkingTolls += f.parking_tolls ?? 0;
      totalOtherExpenses += f.other_expenses ?? 0;

      // Settlement
      if (f.is_settled) {
        settledCount++;
      } else {
        unsettledCount++;
      }
    }

    const totalIncome = totalGuarantee + totalMerchSales + totalOtherIncome;
    const totalExpenses =
      totalHotelCost +
      totalTravelCost +
      totalFoodPerDiem +
      totalEquipmentRental +
      totalParkingTolls +
      totalOtherExpenses;
    const netProfit = totalIncome - totalExpenses;

    return {
      totalGuarantee,
      totalMerchSales,
      totalOtherIncome,
      totalIncome,
      totalHotelCost,
      totalTravelCost,
      totalFoodPerDiem,
      totalEquipmentRental,
      totalParkingTolls,
      totalOtherExpenses,
      totalExpenses,
      netProfit,
      settledCount,
      unsettledCount,
    };
  }, [stops]);
}
