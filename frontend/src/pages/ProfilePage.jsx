import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { schedule, memberships } from "../services/api";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import {
  UserIcon,
  CalendarIcon,
  ClockIcon,
  LocationMarkerIcon,
  UserGroupIcon,
  XCircleIcon,
  CreditCardIcon,
  CheckCircleIcon,
  PhoneIcon,
  MailIcon,
  CakeIcon,
} from "@heroicons/react/outline";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [membershipsList, setMembershipsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [allBookings, upcoming, membershipsRes] = await Promise.all([
        schedule.myBookings(),
        schedule.upcoming(),
        memberships.getMy(),
      ]);

      console.log("Все записи (история):", allBookings.data);
      console.log("Предстоящие:", upcoming.data);
      console.log("Абонементы:", membershipsRes.data);

      setBookings(allBookings.data || []);
      setUpcomingBookings(upcoming.data || []);

      const sortedMemberships = (membershipsRes.data || []).sort((a, b) => {
        if (a.status === "active" && b.status !== "active") return -1;
        if (a.status !== "active" && b.status === "active") return 1;
        return new Date(b.end_date) - new Date(a.end_date);
      });

      setMembershipsList(sortedMemberships);
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
      toast.error("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (booking) => {
    const lessonDate = new Date(booking.lesson?.date_lesson);
    const now = new Date();
    const hoursBefore = (lessonDate - now) / (1000 * 60 * 60);

    if (hoursBefore < 3) {
      toast.error(
        `Нельзя отменить запись менее чем за 3 часа до начала. До начала осталось ${Math.round(hoursBefore)} ч.`,
      );
      return;
    }

    if (!window.confirm("Вы уверены, что хотите отменить запись?")) {
      return;
    }

    setCancellingId(booking.id);
    try {
      await schedule.cancel(booking.id);
      toast.success("Запись отменена");
      loadData();
    } catch (error) {
      console.error("Ошибка отмены:", error);
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Не удалось отменить запись");
      }
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            Активен
          </span>
        );
      case "EXPIRED":
        return (
          <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            Истек
          </span>
        );
      case "USED":
        return (
          <span className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
            Использован
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            Отменено
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            Подтверждено
          </span>
        );
      case "VISITED":
        return (
          <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            Посетил
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            {status}
          </span>
        );
    }
  };

  const activeMemberships = membershipsList.filter(
    (m) => m.status === "active",
  );
  const historyMemberships = membershipsList.filter(
    (m) => m.status !== "active",
  );

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Профиль пользователя
          </h2>
          <p className="text-gray-600">
            Войдите в систему, чтобы увидеть свой профиль
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Информация о пользователе */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <UserIcon className="w-10 h-10 text-primary-600" />
            </div>
            <div className="ml-4 text-white">
              <h1 className="text-2xl font-bold">
                {user?.last_name} {user?.first_name} {user?.patronymic}
              </h1>
              <p className="text-primary-100">{user?.phone}</p>
              {user?.email && <p className="text-primary-100">{user?.email}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Мои абонементы */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <CreditCardIcon className="w-6 h-6 mr-2 text-primary-500" />
          Мои абонементы
        </h2>

        {membershipsList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <CreditCardIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">У вас пока нет абонементов</p>
            <p className="text-gray-400 text-sm mt-2">
              Приобрести абонементы можно в студии
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Активные абонементы */}
            {activeMemberships.map((membership) => (
              <div
                key={membership.id}
                className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-green-500 hover:shadow-lg transition"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {membership.membership_offer?.lesson_type?.name ||
                          "Абонемент"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Приобретен:{" "}
                        {format(
                          parseISO(membership.purchase_date),
                          "dd MMMM yyyy",
                          { locale: ru },
                        )}
                      </p>
                    </div>
                    {getStatusBadge(membership.status)}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-gray-600">
                      <CalendarIcon className="w-5 h-5 mr-2 text-primary-500" />
                      <span>
                        Действует до:{" "}
                        {format(parseISO(membership.end_date), "dd MMMM yyyy", {
                          locale: ru,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">
                        Осталось занятий:
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {membership.remaining_classes}
                      </span>
                    </div>
                  </div>

                  {membership.membership_offer?.lesson_count?.count && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>Использовано</span>
                        <span>
                          {membership.membership_offer.lesson_count.count -
                            membership.remaining_classes}{" "}
                          / {membership.membership_offer.lesson_count.count}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{
                            width: `${((membership.membership_offer.lesson_count.count - membership.remaining_classes) / membership.membership_offer.lesson_count.count) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* История абонементов */}
            {historyMemberships.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  История абонементов
                </h3>
                <div className="space-y-3">
                  {historyMemberships.map((membership) => (
                    <div
                      key={membership.id}
                      className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-gray-300 opacity-75 hover:opacity-100 transition"
                    >
                      <div className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-700">
                              {membership.membership_offer?.lesson_type?.name ||
                                "Абонемент"}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {format(
                                parseISO(membership.start_date),
                                "dd.MM.yyyy",
                              )}{" "}
                              -{" "}
                              {format(
                                parseISO(membership.end_date),
                                "dd.MM.yyyy",
                              )}
                            </p>
                          </div>
                          <div className="mt-2 md:mt-0">
                            {getStatusBadge(membership.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Будущие записи */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <CalendarIcon className="w-6 h-6 mr-2 text-primary-500" />
          Предстоящие занятия
        </h2>

        {upcomingBookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              У вас нет предстоящих занятий
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {upcomingBookings.map((booking) => {
              const lessonDate = new Date(booking.lesson?.date_lesson);
              const now = new Date();
              const hoursBefore = (lessonDate - now) / (1000 * 60 * 60);

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {booking.lesson?.lesson_type?.name}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <CalendarIcon className="w-4 h-4 mr-1 text-primary-500" />
                            <span>
                              {format(lessonDate, "d MMMM", { locale: ru })}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <ClockIcon className="w-4 h-4 mr-1 text-primary-500" />
                            <span>{format(lessonDate, "HH:mm")}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <UserGroupIcon className="w-4 h-4 mr-1 text-primary-500" />
                            <span>{booking.lesson?.trainer?.name}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <LocationMarkerIcon className="w-4 h-4 mr-1 text-primary-500" />
                            <span>{booking.lesson?.gym?.name}</span>
                          </div>
                        </div>

                        {/* Индикатор времени до начала */}
                        {hoursBefore < 3 ? (
                          <p className="text-xs text-red-500 mt-2">
                            ⚠️ Отмена невозможна (менее 3 часов до начала)
                          </p>
                        ) : hoursBefore < 6 ? (
                          <p className="text-xs text-orange-500 mt-2">
                            Осталось {Math.round(hoursBefore)} ч. до начала
                          </p>
                        ) : null}
                      </div>

                      <button
                        onClick={() => handleCancelBooking(booking)}
                        disabled={
                          cancellingId === booking.id || hoursBefore < 3
                        }
                        className={`mt-4 md:mt-0 md:ml-4 flex items-center justify-center px-4 py-2 rounded-lg transition ${
                          hoursBefore < 3
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "btn-secondary text-red-600 hover:text-red-700"
                        }`}
                      >
                        {cancellingId === booking.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                            Отмена...
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="w-5 h-5 mr-1" />
                            Отменить
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* История записей */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <ClockIcon className="w-6 h-6 mr-2 text-gray-500" />
          История посещений
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : bookings.filter(
            (b) => b.status === "VISITED" || b.status === "CANCELLED",
          ).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500">История посещений пуста</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Занятие
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Тренер
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings
                    .filter(
                      (b) => b.status === "VISITED" || b.status === "CANCELLED",
                    )
                    .map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(
                            new Date(booking.lesson?.date_lesson),
                            "dd.MM.yyyy HH:mm",
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.lesson?.lesson_type?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.lesson?.trainer?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {booking.status === "VISITED" ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Посетил
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                              Отменено
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Дополнительная информация о пользователе */}
      <div className="mt-8 bg-primary-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-primary-800 mb-4">
          Контакты
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center text-primary-700">
            <PhoneIcon className="w-5 h-5 mr-3" />
            <span>{user?.phone}</span>
          </div>
          {user?.email && (
            <div className="flex items-center text-primary-700">
              <MailIcon className="w-5 h-5 mr-3" />
              <span>{user?.email}</span>
            </div>
          )}
          {user?.birth_date && (
            <div className="flex items-center text-primary-700">
              <CakeIcon className="w-5 h-5 mr-3" />
              <span>
                {format(parseISO(user.birth_date), "dd MMMM yyyy", {
                  locale: ru,
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
