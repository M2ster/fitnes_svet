import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { admin, memberships, schedule } from '../services/api';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import CreateTemplateModal from '../components/Admin/CreateTemplateModal';
import GymsList from '../components/Admin/GymsList';
import SalesReport from "../components/Admin/SalesReport";
import {
    UsersIcon,
    CalendarIcon,
    CreditCardIcon,
    PlusIcon,
    EyeIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserGroupIcon,
    TrashIcon,
    RefreshIcon,
    SearchIcon,
    ClockIcon,
    LocationMarkerIcon,
    UserIcon,
    PhoneIcon,
    MailIcon,
    CakeIcon,
    ShieldCheckIcon,
    ChartBarIcon,
    PencilIcon,
    PhotographIcon,
    TemplateIcon
} from '@heroicons/react/outline';
import CreateLessonModal from '../components/Admin/CreateLessonModal';
import CreateMembershipModal from '../components/Admin/CreateMembershipModal';
import CreateOfferModal from '../components/Admin/CreateOfferModal';
import TrainersList from '../components/Admin/TrainersList';
import ScheduleGenerator from '../components/Admin/ScheduleGenerator';
import toast from 'react-hot-toast';

const AdminPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);

    // Данные для разных табов
    const [stats, setStats] = useState({
        total_users: 0,
        active_memberships: 0,
        today_lessons: 0,
        today_bookings: 0,
        popular_lessons: [],
        recent_bookings: 0
    });

    const [lessons, setLessons] = useState([]);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [membershipsList, setMembershipsList] = useState([]);
    const [membershipOffers, setMembershipOffers] = useState([]);
    const [expiringMemberships, setExpiringMemberships] = useState([]);
    const [templates, setTemplates] = useState([]);

    // UI состояния
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [showCreateLesson, setShowCreateLesson] = useState(false);
    const [showCreateMembership, setShowCreateMembership] = useState(false);
    const [showCreateOffer, setShowCreateOffer] = useState(false);
    const [showCreateTemplate, setShowCreateTemplate] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [lessonBookings, setLessonBookings] = useState([]);
    const [showBookings, setShowBookings] = useState(false);
    const [showUserDetails, setShowUserDetails] = useState(false);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [newUser, setNewUser] = useState({
        first_name: '',
        last_name: '',
        patronymic: '',
        phone: '',
        email: '',
        password: '',
        is_admin: false
    });

    const tabs = [
      { id: "dashboard", name: "Дашборд", icon: ChartBarIcon },
      { id: "schedule", name: "Расписание", icon: CalendarIcon },
      { id: "templates", name: "Шаблоны", icon: TemplateIcon },
      { id: "trainers", name: "Тренеры", icon: UserIcon },
      { id: "gyms", name: "Залы", icon: PhotographIcon },
      { id: "users", name: "Пользователи", icon: UsersIcon },
      { id: "memberships", name: "Абонементы", icon: CreditCardIcon },
      { id: "offers", name: "Типы абонементов", icon: PhotographIcon },
      { id: "reports", name: "Отчеты", icon: ChartBarIcon },
    ];

    // Загружаем данные при смене вкладки
    useEffect(() => {
        if (activeTab === 'dashboard') {
            loadDashboardData();
        } else if (activeTab === 'schedule') {
            loadSchedule();
        } else if (activeTab === 'templates') {
            loadTemplates();
        } else if (activeTab === 'users') {
            loadUsers();
        } else if (activeTab === 'memberships') {
            loadMemberships();
        } else if (activeTab === 'offers') {
            loadMembershipOffers();
        }
    }, [activeTab, selectedDate]);

    // Фильтрация пользователей при поиске
    useEffect(() => {
        if (!userSearchTerm.trim()) {
            setFilteredUsers(users);
        } else {
            const searchLower = userSearchTerm.toLowerCase();
            const filtered = users.filter(u =>
                u.first_name?.toLowerCase().includes(searchLower) ||
                u.last_name?.toLowerCase().includes(searchLower) ||
                u.patronymic?.toLowerCase().includes(searchLower) ||
                u.phone?.includes(userSearchTerm) ||
                u.email?.toLowerCase().includes(searchLower)
            );
            setFilteredUsers(filtered);
        }
    }, [userSearchTerm, users]);

    // ===== ЗАГРУЗКА ДАННЫХ =====

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            console.log('Загрузка данных для дашборда...');

            const statsRes = await admin.getStats();
            console.log('Статистика:', statsRes.data);
            setStats(statsRes.data);

            const expiringRes = await admin.getExpiringMemberships(7);
            console.log('Истекающие абонементы:', expiringRes.data);
            setExpiringMemberships(expiringRes.data);

        } catch (error) {
            console.error('Ошибка загрузки данных дашборда:', error);
            toast.error('Не удалось загрузить статистику');
        } finally {
            setLoading(false);
        }
    };

    const loadSchedule = async () => {
        try {
            setLoading(true);
            console.log('Загрузка расписания на:', selectedDate);
            const response = await schedule.getByDate(selectedDate);
            console.log('Расписание:', response.data);
            setLessons(response.data);
        } catch (error) {
            console.error('Ошибка загрузки расписания:', error);
            toast.error('Не удалось загрузить расписание');
        } finally {
            setLoading(false);
        }
    };

    const loadTemplates = async () => {
        try {
            setLoading(true);
            console.log('Загрузка шаблонов расписания...');
            const response = await admin.getScheduleTemplates();
            console.log('Шаблоны:', response.data);
            setTemplates(response.data);
        } catch (error) {
            console.error('Ошибка загрузки шаблонов:', error);
            toast.error('Не удалось загрузить шаблоны');
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            setLoading(true);
            console.log('Загрузка пользователей...');
            const response = await admin.getUsers();
            console.log('Пользователи:', response.data);
            setUsers(response.data);
            setFilteredUsers(response.data);
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
            toast.error('Не удалось загрузить пользователей');
        } finally {
            setLoading(false);
        }
    };

    const loadMemberships = async () => {
        try {
            setLoading(true);
            console.log('Загрузка абонементов...');
            const response = await admin.getMemberships();
            console.log('Абонементы:', response.data);
            setMembershipsList(response.data);
        } catch (error) {
            console.error('Ошибка загрузки абонементов:', error);
            toast.error('Не удалось загрузить абонементы');
        } finally {
            setLoading(false);
        }
    };

    const loadMembershipOffers = async () => {
        try {
            setLoading(true);
            console.log('Загрузка типов абонементов...');
            const response = await admin.getMembershipOffers();
            console.log('Типы абонементов:', response.data);
            setMembershipOffers(response.data);
        } catch (error) {
            console.error('Ошибка загрузки типов абонементов:', error);
            toast.error('Не удалось загрузить типы абонементов');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!userSearchTerm.trim()) {
            setFilteredUsers(users);
            return;
        }

        try {
            setLoading(true);
            const response = await admin.searchUsers(userSearchTerm);
            setFilteredUsers(response.data);
        } catch (error) {
            console.error('Ошибка поиска:', error);
            toast.error('Ошибка при поиске');
        } finally {
            setLoading(false);
        }
    };

    const handleViewBookings = async (lesson) => {
        setSelectedLesson(lesson);
        try {
            setLoading(true);
            const response = await admin.getLessonBookings(lesson.id);
            setLessonBookings(response.data);
            setShowBookings(true);
        } catch (error) {
            console.error('Ошибка загрузки записей:', error);
            toast.error('Не удалось загрузить записи');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async (bookingId, currentStatus) => {
        try {
            const newStatus = currentStatus === 'confirmed' ? 'visited' : 'confirmed';
            await admin.checkin(bookingId, newStatus);
            toast.success('Статус обновлен');
            setLessonBookings(prev =>
                prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)
            );
        } catch (error) {
            console.error('Ошибка отметки:', error);
            toast.error('Не удалось обновить статус');
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (!window.confirm('Вы уверены, что хотите удалить это занятие?')) {
            return;
        }

        try {
            await admin.deleteLesson(lessonId);
            toast.success('Занятие удалено');
            loadSchedule();
        } catch (error) {
            console.error('Ошибка удаления:', error);
            toast.error('Не удалось удалить занятие');
        }
    };

    const handleDeleteOffer = async (offerId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот тип абонемента?')) {
            return;
        }

        try {
            setLoading(true);
            await admin.deleteMembershipOffer(offerId);
            toast.success('Тип абонемента удален');
            loadMembershipOffers();
        } catch (error) {
            console.error('Ошибка удаления:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось удалить тип абонемента';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTemplate = async (templateId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот шаблон?')) {
            return;
        }

        try {
            setLoading(true);
            await admin.deleteScheduleTemplate(templateId);
            toast.success('Шаблон удален');
            loadTemplates();
        } catch (error) {
            console.error('Ошибка удаления шаблона:', error);
            toast.error('Не удалось удалить шаблон');
        } finally {
            setLoading(false);
        }
    };

    const handleViewUserDetails = async (user) => {
        try {
            setLoading(true);
            const response = await admin.getUserDetails(user.id);
            setSelectedUser(response.data);
            setShowUserDetails(true);
        } catch (error) {
            console.error('Ошибка загрузки деталей пользователя:', error);
            toast.error('Не удалось загрузить информацию о пользователе');
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async () => {
        if (!newUser.first_name || !newUser.last_name || !newUser.phone || !newUser.password) {
            toast.error('Заполните обязательные поля');
            return;
        }

        try {
            setLoading(true);
            await admin.createUser(newUser);
            toast.success('Пользователь успешно создан');
            setShowAddUserModal(false);
            setNewUser({
                first_name: '',
                last_name: '',
                patronymic: '',
                phone: '',
                email: '',
                password: '',
                is_admin: false
            });
            loadUsers();
        } catch (error) {
            console.error('Ошибка создания пользователя:', error);
            toast.error('Не удалось создать пользователя');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'confirmed':
                return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Подтверждено</span>;
            case 'visited':
                return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Посетил</span>;
            case 'cancelled':
                return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Отменено</span>;
            case 'no_show':
                return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Не пришел</span>;
            case 'active':
                return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Активен</span>;
            case 'expired':
                return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Истек</span>;
            case 'used':
                return <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Использован</span>;
            default:
                return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>;
        }
    };

    const weekdays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

    return (
      <div className="min-h-screen bg-[#F5F0E9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Заголовок */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#2C1810] mb-2">
              Административная панель
            </h1>
            <p className="text-[#6B4F3A]">
              Управление расписанием, пользователями и абонементами
            </p>
          </div>

          {/* Табы */}
          <div className="border-b border-[#E8DDD2] mb-8 overflow-x-auto">
            <nav className="flex -mb-px space-x-8 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      activeTab === tab.id
                        ? "border-[#8B6B4D] text-[#8B6B4D]"
                        : "border-transparent text-[#6B4F3A] hover:text-[#8B6B4D] hover:border-[#D4C5B5]"
                    }
                  `}
                  >
                    <Icon
                      className={`
                    w-5 h-5 mr-2
                    ${activeTab === tab.id ? "text-[#8B6B4D]" : "text-[#A5896C] group-hover:text-[#8B6B4D]"}
                  `}
                    />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Контент табов */}

          {/* Вкладка Дашборд */}
          {activeTab === "dashboard" && (
            <div>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B6B4D]"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Статистика */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-[#E8DDD2] shadow-md p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-[#F5F0E9] rounded-none">
                          <UsersIcon className="w-6 h-6 text-[#8B6B4D]" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm text-[#6B4F3A]">
                            Всего пользователей
                          </p>
                          <p className="text-2xl font-bold text-[#2C1810]">
                            {stats.total_users}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-[#E8DDD2] shadow-md p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-[#F5F0E9] rounded-none">
                          <CreditCardIcon className="w-6 h-6 text-[#8B6B4D]" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm text-[#6B4F3A]">
                            Активных абонементов
                          </p>
                          <p className="text-2xl font-bold text-[#2C1810]">
                            {stats.active_memberships}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-[#E8DDD2] shadow-md p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-[#F5F0E9] rounded-none">
                          <CalendarIcon className="w-6 h-6 text-[#8B6B4D]" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm text-[#6B4F3A]">
                            Занятий сегодня
                          </p>
                          <p className="text-2xl font-bold text-[#2C1810]">
                            {stats.today_lessons}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-[#E8DDD2] shadow-md p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-[#F5F0E9] rounded-none">
                          <UserGroupIcon className="w-6 h-6 text-[#8B6B4D]" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm text-[#6B4F3A]">
                            Записей сегодня
                          </p>
                          <p className="text-2xl font-bold text-[#2C1810]">
                            {stats.today_bookings}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Популярные занятия и истекающие абонементы */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white border border-[#E8DDD2] shadow-md p-6">
                      <h3 className="font-serif text-lg font-bold text-[#2C1810] mb-4">
                        Популярные занятия
                      </h3>
                      {stats.popular_lessons &&
                      stats.popular_lessons.length > 0 ? (
                        <div className="space-y-3">
                          {stats.popular_lessons.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between"
                            >
                              <span className="text-[#6B4F3A]">
                                {item.name}
                              </span>
                              <span className="font-medium text-[#8B6B4D]">
                                {item.count} записей
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[#A5896C] text-center py-4">
                          Нет данных о популярных занятиях
                        </p>
                      )}
                    </div>

                    <div className="bg-white border border-[#E8DDD2] shadow-md p-6">
                      <h3 className="font-serif text-lg font-bold text-[#2C1810] mb-4">
                        Истекают через 7 дней
                      </h3>
                      {expiringMemberships.length > 0 ? (
                        <div className="space-y-3">
                          {expiringMemberships.map((item) => (
                            <div
                              key={item.id}
                              className="border-b border-[#E8DDD2] pb-2 last:border-0"
                            >
                              <p className="font-medium text-[#2C1810]">
                                {item.user_name}
                              </p>
                              <p className="text-sm text-[#6B4F3A]">
                                {item.offer_name}
                              </p>
                              <div className="flex justify-between mt-1">
                                <span className="text-xs text-[#A5896C]">
                                  Осталось: {item.remaining_classes} занятий
                                </span>
                                <span className="text-xs text-[#8B6B4D] font-medium">
                                  {item.days_left} дн.
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[#A5896C] text-center py-4">
                          Нет истекающих абонементов
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Общая статистика */}
                  <div className="bg-white border border-[#E8DDD2] shadow-md p-6">
                    <h3 className="font-serif text-lg font-bold text-[#2C1810] mb-4">
                      Общая статистика
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-[#6B4F3A]">
                          Всего пользователей
                        </p>
                        <p className="text-2xl font-bold text-[#2C1810]">
                          {stats.total_users}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6B4F3A]">
                          Активных абонементов
                        </p>
                        <p className="text-2xl font-bold text-[#2C1810]">
                          {stats.active_memberships}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6B4F3A]">
                          Записей за 7 дней
                        </p>
                        <p className="text-2xl font-bold text-[#2C1810]">
                          {stats.recent_bookings || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6B4F3A]">
                          Занятий сегодня
                        </p>
                        <p className="text-2xl font-bold text-[#2C1810]">
                          {stats.today_lessons}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Вкладка Расписание */}
          {activeTab === "schedule" && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input-field w-auto"
                  />
                  <button
                    onClick={loadSchedule}
                    className="btn-secondary flex items-center"
                  >
                    <RefreshIcon className="w-4 h-4 mr-2" />
                    Обновить
                  </button>
                </div>
                <button
                  onClick={() => setShowCreateLesson(true)}
                  className="btn-primary flex items-center"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Добавить занятие
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B6B4D]"></div>
                </div>
              ) : lessons.length === 0 ? (
                <div className="text-center py-16 bg-white border border-[#E8DDD2] shadow-md">
                  <CalendarIcon className="w-16 h-16 text-[#D4C5B5] mx-auto mb-4" />
                  <h3 className="font-serif text-xl font-medium text-[#2C1810] mb-2">
                    Нет занятий
                  </h3>
                  <p className="text-[#6B4F3A] mb-6">
                    На этот день нет запланированных тренировок
                  </p>
                  <button
                    onClick={() => setShowCreateLesson(true)}
                    className="btn-primary inline-flex items-center"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Создать занятие
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="bg-white border border-[#E8DDD2] shadow-md hover:shadow-lg transition p-6"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1 mb-4 lg:mb-0">
                          <h3 className="font-serif text-xl font-bold text-[#2C1810] mb-2">
                            {lesson.lesson_type?.name || "Занятие"}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center text-[#6B4F3A]">
                              <ClockIcon className="w-4 h-4 mr-1 text-[#8B6B4D]" />
                              <span>
                                {lesson.date_lesson
                                  ? format(
                                      parseISO(lesson.date_lesson),
                                      "HH:mm",
                                    )
                                  : "—"}
                              </span>
                            </div>
                            <div className="flex items-center text-[#6B4F3A]">
                              <UserIcon className="w-4 h-4 mr-1 text-[#8B6B4D]" />
                              <span className="truncate">
                                {lesson.trainer?.name || "—"}
                              </span>
                            </div>
                            <div className="flex items-center text-[#6B4F3A]">
                              <LocationMarkerIcon className="w-4 h-4 mr-1 text-[#8B6B4D]" />
                              <span>{lesson.gym?.name || "—"}</span>
                            </div>
                            <div className="flex items-center text-[#6B4F3A]">
                              <UserGroupIcon className="w-4 h-4 mr-1 text-[#8B6B4D]" />
                              <span>
                                {lesson.booked_count || 0}/
                                {lesson.lesson_type?.capacity || 0}
                              </span>
                            </div>
                          </div>

                          {/* Прогресс-бар заполненности */}
                          <div className="mt-4">
                            <div className="w-full h-2 bg-[#E8DDD2] rounded-none">
                              <div
                                className={`h-full rounded-none ${
                                  (lesson.booked_count || 0) /
                                    (lesson.lesson_type?.capacity || 1) >=
                                  0.8
                                    ? "bg-[#8B6B4D]"
                                    : (lesson.booked_count || 0) /
                                          (lesson.lesson_type?.capacity || 1) >=
                                        0.5
                                      ? "bg-[#A5896C]"
                                      : "bg-[#D4C5B5]"
                                }`}
                                style={{
                                  width: `${((lesson.booked_count || 0) / (lesson.lesson_type?.capacity || 1)) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 lg:ml-6">
                          <button
                            onClick={() => handleViewBookings(lesson)}
                            className="p-2 text-[#6B4F3A] hover:text-[#8B6B4D] hover:bg-[#F5F0E9] rounded-none transition"
                            title="Смотреть записи"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="p-2 text-[#6B4F3A] hover:text-red-600 hover:bg-red-50 rounded-none transition"
                            title="Удалить"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Вкладка Отчеты */}
          {activeTab === "reports" && <SalesReport />}

          {/* Вкладка Шаблоны */}
          {activeTab === "templates" && (
            <div>
              <ScheduleGenerator onGenerate={loadSchedule} />

              <div className="bg-white border border-[#E8DDD2] shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-serif text-lg font-bold text-[#2C1810]">
                    Управление шаблонами
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedTemplate(null);
                      setShowCreateTemplate(true);
                    }}
                    className="btn-primary flex items-center text-sm py-2"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Добавить шаблон
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8B6B4D]"></div>
                  </div>
                ) : templates.length === 0 ? (
                  <p className="text-[#A5896C] text-center py-8">
                    Нет шаблонов расписания
                  </p>
                ) : (
                  <div className="space-y-6">
                    {/* Активные шаблоны */}
                    <div>
                      <h4 className="font-medium text-[#2C1810] mb-3 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Активные шаблоны (
                        {templates.filter((t) => t.is_active).length})
                      </h4>
                      <div className="space-y-2">
                        {templates
                          .filter((t) => t.is_active)
                          .map((template) => (
                            <div
                              key={template.id}
                              className="flex items-center justify-between p-3 bg-[#F5F0E9] border-l-4 border-green-500 border-t border-r border-b border-[#E8DDD2]"
                            >
                              <div>
                                <p className="font-medium text-[#2C1810]">
                                  {template.lesson_type?.name}
                                </p>
                                <p className="text-sm text-[#6B4F3A]">
                                  {weekdays[template.weekday]},{" "}
                                  {template.start_time} •{" "}
                                  {template.trainer?.name} •{" "}
                                  {template.gym?.name}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedTemplate(template);
                                    setShowCreateTemplate(true);
                                  }}
                                  className="p-1 text-[#6B4F3A] hover:text-[#8B6B4D] transition"
                                  title="Редактировать"
                                >
                                  <PencilIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteTemplate(template.id)
                                  }
                                  className="p-1 text-[#6B4F3A] hover:text-red-600 transition"
                                  title="Удалить"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        {templates.filter((t) => t.is_active).length === 0 && (
                          <p className="text-sm text-[#A5896C] italic py-2">
                            Нет активных шаблонов
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Неактивные шаблоны */}
                    {templates.filter((t) => !t.is_active).length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium text-[#2C1810] mb-3 flex items-center">
                          <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                          Неактивные шаблоны (
                          {templates.filter((t) => !t.is_active).length})
                        </h4>
                        <div className="space-y-2 opacity-75">
                          {templates
                            .filter((t) => !t.is_active)
                            .map((template) => (
                              <div
                                key={template.id}
                                className="flex items-center justify-between p-3 bg-gray-100 border border-gray-200"
                              >
                                <div>
                                  <p className="font-medium text-gray-600">
                                    {template.lesson_type?.name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {weekdays[template.weekday]},{" "}
                                    {template.start_time} •{" "}
                                    {template.trainer?.name} •{" "}
                                    {template.gym?.name}
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedTemplate(template);
                                      setShowCreateTemplate(true);
                                    }}
                                    className="p-1 text-gray-500 hover:text-[#8B6B4D] transition"
                                    title="Редактировать"
                                  >
                                    <PencilIcon className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteTemplate(template.id)
                                    }
                                    className="p-1 text-gray-500 hover:text-red-600 transition"
                                    title="Удалить"
                                  >
                                    <TrashIcon className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Модалка создания/редактирования шаблона */}
              {showCreateTemplate && (
                <CreateTemplateModal
                  template={selectedTemplate}
                  onClose={() => {
                    setShowCreateTemplate(false);
                    setSelectedTemplate(null);
                  }}
                  onSuccess={() => {
                    loadTemplates();
                    setShowCreateTemplate(false);
                    setSelectedTemplate(null);
                  }}
                />
              )}
            </div>
          )}

          {/* Вкладка Тренеры */}
          {activeTab === "trainers" && <TrainersList />}
          {/* Вкладка Залы */}
          {activeTab === "gyms" && <GymsList />}

          {/* Вкладка Пользователи */}
          {activeTab === "users" && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A5896C]" />
                    <input
                      type="text"
                      placeholder="Поиск по имени, телефону или email..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      className="input-field pl-10"
                    />
                  </div>
                  <button onClick={handleSearch} className="btn-primary px-6">
                    Найти
                  </button>
                  <button
                    onClick={loadUsers}
                    className="btn-secondary px-4"
                    title="Обновить список"
                  >
                    <RefreshIcon className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="btn-primary flex items-center"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Добавить пользователя
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B6B4D]"></div>
                </div>
              ) : (
                <div className="bg-white border border-[#E8DDD2] shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#E8DDD2]">
                      <thead className="bg-[#F5F0E9]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#6B4F3A] uppercase tracking-wider">
                            Пользователь
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#6B4F3A] uppercase tracking-wider">
                            Контакты
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#6B4F3A] uppercase tracking-wider">
                            Дата регистрации
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#6B4F3A] uppercase tracking-wider">
                            Абонементов
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#6B4F3A] uppercase tracking-wider">
                            Статус
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-[#6B4F3A] uppercase tracking-wider">
                            Действия
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-[#E8DDD2]">
                        {filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="hover:bg-[#F5F0E9] transition"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-[#F5F0E9] rounded-none flex items-center justify-center">
                                  <UserIcon className="h-5 w-5 text-[#8B6B4D]" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-[#2C1810]">
                                    {user.last_name} {user.first_name}{" "}
                                    {user.patronymic || ""}
                                  </div>
                                  <div className="text-sm text-[#6B4F3A]">
                                    ID: {user.id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-[#2C1810]">
                                {user.phone}
                              </div>
                              {user.email && (
                                <div className="text-sm text-[#6B4F3A]">
                                  {user.email}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-[#2C1810]">
                                {user.created_at
                                  ? format(
                                      parseISO(user.created_at),
                                      "dd.MM.yyyy",
                                    )
                                  : "—"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-sm font-medium bg-[#F5F0E9] text-[#8B6B4D] rounded-none">
                                {user.memberships_count || 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.is_admin ? (
                                <span className="px-2 py-1 text-xs font-medium bg-[#E8DDD2] text-[#8B6B4D] rounded-none flex items-center w-fit">
                                  <ShieldCheckIcon className="w-3 h-3 mr-1" />
                                  Админ
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium bg-[#F5F0E9] text-[#6B4F3A] rounded-none">
                                  Клиент
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleViewUserDetails(user)}
                                className="text-[#8B6B4D] hover:text-[#6B4F3A] mr-3"
                                title="Просмотр"
                              >
                                <EyeIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowCreateMembership(true);
                                }}
                                className="text-[#8B6B4D] hover:text-[#6B4F3A]"
                                title="Добавить абонемент"
                              >
                                <CreditCardIcon className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-[#A5896C]">Пользователи не найдены</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Вкладка Абонементы */}
          {activeTab === "memberships" && (
            <div>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B6B4D]"></div>
                </div>
              ) : (
                <div className="bg-white border border-[#E8DDD2] shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#E8DDD2]">
                      <thead className="bg-[#F5F0E9]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#6B4F3A] uppercase tracking-wider">
                            Пользователь
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#6B4F3A] uppercase tracking-wider">
                            Абонемент
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#6B4F3A] uppercase tracking-wider">
                            Период
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#6B4F3A] uppercase tracking-wider">
                            Осталось
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#6B4F3A] uppercase tracking-wider">
                            Статус
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-[#E8DDD2]">
                        {membershipsList.map((membership) => (
                          <tr
                            key={membership.id}
                            className="hover:bg-[#F5F0E9]"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-[#2C1810]">
                                {membership.user_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-[#2C1810]">
                                {membership.offer_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-[#2C1810]">
                                {membership.start_date} - {membership.end_date}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-sm font-medium bg-[#F5F0E9] text-[#8B6B4D] rounded-none">
                                {membership.remaining_classes}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(membership.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {membershipsList.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-[#A5896C]">Абонементы не найдены</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Вкладка Типы абонементов */}
          {activeTab === "offers" && (
            <div>
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => {
                    setSelectedOffer(null);
                    setShowCreateOffer(true);
                  }}
                  className="btn-primary flex items-center"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Новый тип абонемента
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B6B4D]"></div>
                </div>
              ) : membershipOffers.length === 0 ? (
                <div className="text-center py-16 bg-white border border-[#E8DDD2] shadow-md">
                  <CreditCardIcon className="w-16 h-16 text-[#D4C5B5] mx-auto mb-4" />
                  <h3 className="font-serif text-xl font-medium text-[#2C1810] mb-2">
                    Нет типов абонементов
                  </h3>
                  <p className="text-[#6B4F3A] mb-6">
                    Создайте первый тип абонемента
                  </p>
                  <button
                    onClick={() => {
                      setSelectedOffer(null);
                      setShowCreateOffer(true);
                    }}
                    className="btn-primary inline-flex items-center"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Создать тип абонемента
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {membershipOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="bg-white border border-[#E8DDD2] shadow-md hover:shadow-lg transition p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-serif text-xl font-bold text-[#2C1810]">
                          {offer.lesson_type?.name || "Абонемент"}
                        </h3>
                        <span className="px-2 py-1 bg-[#F5F0E9] text-[#8B6B4D] text-xs font-medium rounded-none">
                          ID: {offer.id}
                        </span>
                      </div>

                      <p className="text-3xl font-bold text-[#8B6B4D] mb-4">
                        {offer.price} ₽
                      </p>

                      <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#6B4F3A]">Занятий:</span>
                          <span className="font-medium text-[#2C1810]">
                            {offer.lesson_count?.count || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#6B4F3A]">Срок действия:</span>
                          <span className="font-medium text-[#2C1810]">
                            {offer.valid_days?.count_day || "—"} дней
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#6B4F3A]">
                            Цена за занятие:
                          </span>
                          <span className="font-medium text-[#2C1810]">
                            {offer.lesson_count?.count
                              ? Math.round(
                                  offer.price / offer.lesson_count.count,
                                )
                              : "—"}{" "}
                            ₽
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedOffer(offer);
                            setShowCreateOffer(true);
                          }}
                          className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center"
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="px-3 py-2 text-[#6B4F3A] hover:text-red-600 hover:bg-red-50 rounded-none transition"
                          title="Удалить"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Модалка создания/редактирования типа абонемента */}
              {showCreateOffer && (
                <CreateOfferModal
                  offer={selectedOffer}
                  onClose={() => {
                    setShowCreateOffer(false);
                    setSelectedOffer(null);
                  }}
                  onSuccess={() => {
                    loadMembershipOffers();
                    setShowCreateOffer(false);
                    setSelectedOffer(null);
                  }}
                />
              )}
            </div>
          )}

          {/* Модалки */}

          {/* Модалка создания занятия */}
          {showCreateLesson && (
            <CreateLessonModal
              onClose={() => setShowCreateLesson(false)}
              onSuccess={() => {
                loadSchedule();
                setShowCreateLesson(false);
              }}
            />
          )}

          {/* Модалка создания абонемента пользователю */}
          {showCreateMembership && selectedUser && (
            <CreateMembershipModal
              user={selectedUser}
              onClose={() => {
                setShowCreateMembership(false);
                setSelectedUser(null);
              }}
              onSuccess={() => {
                loadUsers();
                loadMemberships();
                setShowCreateMembership(false);
                setSelectedUser(null);
              }}
            />
          )}

          {/* Модалка добавления пользователя */}
          {showAddUserModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-none max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#E8DDD2]">
                <div className="sticky top-0 bg-white border-b border-[#E8DDD2] p-6">
                  <h2 className="font-serif text-2xl font-bold text-[#2C1810]">
                    Добавление нового пользователя
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#6B4F3A] mb-1">
                        Имя *
                      </label>
                      <input
                        type="text"
                        value={newUser.first_name}
                        onChange={(e) =>
                          setNewUser({ ...newUser, first_name: e.target.value })
                        }
                        className="input-field"
                        placeholder="Иван"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6B4F3A] mb-1">
                        Фамилия *
                      </label>
                      <input
                        type="text"
                        value={newUser.last_name}
                        onChange={(e) =>
                          setNewUser({ ...newUser, last_name: e.target.value })
                        }
                        className="input-field"
                        placeholder="Иванов"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6B4F3A] mb-1">
                        Отчество
                      </label>
                      <input
                        type="text"
                        value={newUser.patronymic}
                        onChange={(e) =>
                          setNewUser({ ...newUser, patronymic: e.target.value })
                        }
                        className="input-field"
                        placeholder="Иванович"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6B4F3A] mb-1">
                        Телефон *
                      </label>
                      <input
                        type="text"
                        value={newUser.phone}
                        onChange={(e) =>
                          setNewUser({ ...newUser, phone: e.target.value })
                        }
                        className="input-field"
                        placeholder="+79991234567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6B4F3A] mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) =>
                          setNewUser({ ...newUser, email: e.target.value })
                        }
                        className="input-field"
                        placeholder="ivan@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6B4F3A] mb-1">
                        Пароль *
                      </label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) =>
                          setNewUser({ ...newUser, password: e.target.value })
                        }
                        className="input-field"
                        placeholder="Минимум 6 символов"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_admin"
                        checked={newUser.is_admin}
                        onChange={(e) =>
                          setNewUser({ ...newUser, is_admin: e.target.checked })
                        }
                        className="h-4 w-4 text-[#8B6B4D] focus:ring-[#8B6B4D] border-[#D4C5B5] rounded-none"
                      />
                      <label
                        htmlFor="is_admin"
                        className="ml-2 block text-sm text-[#6B4F3A]"
                      >
                        Администратор
                      </label>
                    </div>
                  </div>
                  <div className="mt-6 flex space-x-3">
                    <button
                      onClick={handleAddUser}
                      disabled={loading}
                      className="flex-1 btn-primary py-3"
                    >
                      {loading ? "Сохранение..." : "Создать"}
                    </button>
                    <button
                      onClick={() => setShowAddUserModal(false)}
                      className="flex-1 btn-secondary py-3"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Модалка записей на занятие */}
          {showBookings && selectedLesson && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Записи на занятие
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedLesson.lesson_type?.name} ·{" "}
                        {selectedLesson.date_lesson
                          ? format(
                              parseISO(selectedLesson.date_lesson),
                              "d MMMM yyyy, HH:mm",
                              { locale: ru },
                            )
                          : "—"}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowBookings(false);
                        setSelectedLesson(null);
                      }}
                      className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"
                    >
                      <XCircleIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : lessonBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">
                        Нет записей на это занятие
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lessonBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="border rounded-lg p-4 hover:shadow-md transition"
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="flex-1 mb-3 md:mb-0">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                                  <UserIcon className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {booking.user_name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {booking.user_phone}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 text-sm text-gray-500">
                                Записался:{" "}
                                {booking.booking_time
                                  ? format(
                                      parseISO(booking.booking_time),
                                      "dd.MM.yyyy HH:mm",
                                    )
                                  : "—"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Модалка деталей пользователя */}
          {showUserDetails && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-none max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E8DDD2]">
                <div className="sticky top-0 bg-white border-b border-[#E8DDD2] p-6">
                  <div className="flex justify-between items-center">
                    <h2 className="font-serif text-2xl font-bold text-[#2C1810]">
                      Информация о пользователе
                    </h2>
                    <button
                      onClick={() => {
                        setShowUserDetails(false);
                        setSelectedUser(null);
                      }}
                      className="text-[#A5896C] hover:text-[#6B4F3A] transition p-2 hover:bg-[#F5F0E9] rounded-none"
                    >
                      <XCircleIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center mb-6">
                    <div className="w-20 h-20 bg-[#F5F0E9] rounded-none flex items-center justify-center">
                      <UserIcon className="w-10 h-10 text-[#8B6B4D]" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-serif text-2xl font-bold text-[#2C1810]">
                        {selectedUser.last_name} {selectedUser.first_name}
                      </h3>
                      <p className="text-[#6B4F3A]">
                        {selectedUser.patronymic}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#6B4F3A] mb-1">
                          <PhoneIcon className="w-4 h-4 inline mr-1" />
                          Телефон
                        </label>
                        <p className="text-[#2C1810]">{selectedUser.phone}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#6B4F3A] mb-1">
                          <MailIcon className="w-4 h-4 inline mr-1" />
                          Email
                        </label>
                        <p className="text-[#2C1810]">
                          {selectedUser.email || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#6B4F3A] mb-1">
                          <CakeIcon className="w-4 h-4 inline mr-1" />
                          Дата рождения
                        </label>
                        <p className="text-[#2C1810]">
                          {selectedUser.birth_date
                            ? format(
                                parseISO(selectedUser.birth_date),
                                "dd.MM.yyyy",
                              )
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#6B4F3A] mb-1">
                          <CalendarIcon className="w-4 h-4 inline mr-1" />
                          Дата регистрации
                        </label>
                        <p className="text-[#2C1810]">
                          {selectedUser.created_at
                            ? format(
                                parseISO(selectedUser.created_at),
                                "dd.MM.yyyy",
                              )
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h4 className="font-serif text-lg font-bold text-[#2C1810] mb-4">
                      Абонементы
                    </h4>
                    <div className="bg-[#F5F0E9] p-4">
                      {selectedUser.memberships_count > 0 ? (
                        <p className="text-[#2C1810]">
                          У пользователя {selectedUser.memberships_count}{" "}
                          абонементов
                        </p>
                      ) : (
                        <p className="text-[#6B4F3A]">Нет абонементов</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex space-x-3">
                    <button
                      onClick={() => {
                        setShowUserDetails(false);
                        setSelectedUser(selectedUser);
                        setShowCreateMembership(true);
                      }}
                      className="flex-1 btn-primary py-3"
                    >
                      <CreditCardIcon className="w-5 h-5 inline mr-2" />
                      Добавить абонемент
                    </button>
                    <button
                      onClick={() => setShowUserDetails(false)}
                      className="flex-1 btn-secondary py-3"
                    >
                      Закрыть
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
};

export default AdminPage;