package com.braintumor.repository;

import com.braintumor.entity.AnalysisHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalysisHistoryRepository extends JpaRepository<AnalysisHistory, String> {

    List<AnalysisHistory> findAllByOrderByCreatedAtDesc();

    Page<AnalysisHistory> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
