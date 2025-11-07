// src/utils/statusUtils.js

export const getStatusStyle = (status) => {
    const styles = {
        'ACTIVE': 'bg-green-100 text-green-800',
        'DORMANT': 'bg-yellow-100 text-yellow-800',
        'SUSPENDED': 'bg-red-100 text-red-800',
        'TERMINATED': 'bg-gray-100 text-gray-800',
        'COMPLETE': 'bg-blue-100 text-blue-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusText = (status) => {
    const texts = {
        'ACTIVE': '정상',
        'DORMANT': '휴면',
        'SUSPENDED': '정지',
        'TERMINATED': '해지',
        'COMPLETE': '완료'
    };
    return texts[status] || status;
};

export const getStatusIcon = (status) => {
    const icons = {
        'ACTIVE': 'ri-checkbox-circle-line',
        'DORMANT': 'ri-moon-line',
        'SUSPENDED': 'ri-pause-circle-line',
        'TERMINATED': 'ri-close-circle-line',
        'COMPLETE': 'ri-check-line'
    };
    return icons[status] || 'ri-question-line';
};

export const getAvailableStatusChanges = (currentStatus) => {
    const transitions = {
        'ACTIVE': ['DORMANT', 'SUSPENDED', 'TERMINATED'],
        'DORMANT': ['ACTIVE', 'SUSPENDED', 'TERMINATED'],
        'SUSPENDED': ['ACTIVE', 'TERMINATED'],
        'TERMINATED': ['ACTIVE'],
        'COMPLETE': []
    };
    return transitions[currentStatus] || [];
};